import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface SmartBudgetStackProps extends cdk.StackProps {
  environment: 'dev' | 'staging' | 'prod';
}

export class SmartBudgetStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SmartBudgetStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'SmartBudgetVpc', {
      maxAzs: 2,
      natGateways: environment === 'prod' ? 2 : 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });

    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Security group for ElastiCache Redis',
      allowAllOutbound: false,
    });

    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc,
      description: 'Security group for ECS tasks',
    });

    // Allow app to connect to DB
    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from ECS'
    );

    // Allow app to connect to Redis
    redisSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Redis from ECS'
    );

    // Database credentials secret
    const dbCredentials = new secretsmanager.Secret(this, 'DbCredentials', {
      secretName: `smart-budget/${environment}/db-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // JWT Secret
    const jwtSecret = new secretsmanager.Secret(this, 'JwtSecret', {
      secretName: `smart-budget/${environment}/jwt-secret`,
      generateSecretString: {
        excludePunctuation: false,
        passwordLength: 64,
      },
    });

    // RDS PostgreSQL
    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        environment === 'prod' ? ec2.InstanceClass.T3 : ec2.InstanceClass.T3,
        environment === 'prod' ? ec2.InstanceSize.SMALL : ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbCredentials),
      databaseName: 'smartbudget',
      multiAz: environment === 'prod',
      allocatedStorage: 20,
      maxAllocatedStorage: environment === 'prod' ? 100 : 50,
      deleteAutomatedBackups: environment !== 'prod',
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // ElastiCache Redis Subnet Group
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis',
      subnetIds: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }).subnetIds,
      cacheSubnetGroupName: `smart-budget-${environment}-redis-subnet`,
    });

    // ElastiCache Redis
    const redis = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: environment === 'prod' ? 'cache.t3.small' : 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
      clusterName: `smart-budget-${environment}-redis`,
    });
    redis.addDependency(redisSubnetGroup);

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: `smart-budget-${environment}`,
      containerInsights: environment === 'prod',
    });

    // Application Load Balanced Fargate Service
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'FargateService', {
      cluster,
      cpu: environment === 'prod' ? 512 : 256,
      memoryLimitMiB: environment === 'prod' ? 1024 : 512,
      desiredCount: environment === 'prod' ? 2 : 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../backend'),
        containerPort: 3000,
        environment: {
          NODE_ENV: environment === 'prod' ? 'production' : 'development',
          DB_HOST: database.dbInstanceEndpointAddress,
          DB_PORT: '5432',
          DB_NAME: 'smartbudget',
          REDIS_HOST: redis.attrRedisEndpointAddress,
          REDIS_PORT: '6379',
        },
        secrets: {
          DB_USER: ecs.Secret.fromSecretsManager(dbCredentials, 'username'),
          DB_PASSWORD: ecs.Secret.fromSecretsManager(dbCredentials, 'password'),
          JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret),
        },
      },
      securityGroups: [appSecurityGroup],
      publicLoadBalancer: true,
      assignPublicIp: false,
    });

    // Health check
    fargateService.targetGroup.configureHealthCheck({
      path: '/health',
      healthyHttpCodes: '200,503', // 503 is ok for health check with degraded services
    });

    // Auto-scaling
    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: environment === 'prod' ? 2 : 1,
      maxCapacity: environment === 'prod' ? 10 : 3,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL endpoint',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redis.attrRedisEndpointAddress,
      description: 'ElastiCache Redis endpoint',
    });
  }
}

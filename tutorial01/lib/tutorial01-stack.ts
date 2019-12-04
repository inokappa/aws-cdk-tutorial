import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import cf = require('@aws-cdk/aws-cloudfront');
import iam = require('@aws-cdk/aws-iam');
import route53 = require('@aws-cdk/aws-route53');
import route53_targets = require('@aws-cdk/aws-route53-targets/lib');

interface Tutorial01InfraStackProps extends cdk.StackProps {
  domain: string;
  project: string;
  issue: string;
  owner: string;
  certificate_arn: {[key: string]: string};
  logbucket_name: string;
  webacl_id: string;
}

export class Tutorial01InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: Tutorial01InfraStackProps) {
    super(scope, id, props);

    // const envName = this.node.tryGetContext('env');
    const envName = process.env.DEPLOY_ENV ? process.env.DEPLOY_ENV : 'dev';
    const domainName = this.node.tryGetContext('fqdn');

    // Create Bucket for contents
    const websiteBucket = new s3.Bucket(this, `Tutorial01Infra-s3bucket-${this.stackName}`, {
      bucketName: domainName,
    });

    // Define Bucket for logging
    const loggingBucket = s3.Bucket.fromBucketName(
      this,
      `Tutorial01Infra-loggingbucket-${this.stackName}`,
      props.logbucket_name
    );

    // Create CloudFront Origin Access Identity
    const OAI = new cf.CfnCloudFrontOriginAccessIdentity(this, `Tutorial01Infra-identity-${this.stackName}`,{
      cloudFrontOriginAccessIdentityConfig:{
        comment: `Tutorial01Infra-identity-${this.stackName}`
      }
    });

    // Create Access Policy for S3 Bucket
    const webSiteBucketPolicyStatement = new iam.PolicyStatement({effect: iam.Effect.ALLOW});
    webSiteBucketPolicyStatement.addCanonicalUserPrincipal(OAI.attrS3CanonicalUserId);
    webSiteBucketPolicyStatement.addActions("s3:GetObject");
    webSiteBucketPolicyStatement.addResources(`${websiteBucket.bucketArn}/*`);
    websiteBucket.addToResourcePolicy(webSiteBucketPolicyStatement);

    // Create CloudFront Distribution
    const distribution = new cf.CloudFrontWebDistribution(this, `Tutorial01Infra-cloudfront-${this.stackName}`, {
      originConfigs:[
        {
          s3OriginSource: {
            s3BucketSource: websiteBucket,
            originAccessIdentityId: OAI.ref
          },
          behaviors: [{ isDefaultBehavior: true}]
        }
      ],
      aliasConfiguration: {
        acmCertRef: props.certificate_arn[envName],
        names: [domainName],
        sslMethod: cf.SSLMethod.SNI,
        securityPolicy: cf.SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      priceClass: cf.PriceClass.PRICE_CLASS_ALL,
      loggingConfig: {
        bucket: loggingBucket,
        prefix: domainName + '/' 
      },
      webACLId: props.webacl_id
    });

    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: props.domain });
    new route53.ARecord(this, `Distribution-route53-record-${this.stackName}`, {
      recordName: domainName,
      target: route53.AddressRecordTarget.fromAlias(new route53_targets.CloudFrontTarget(distribution)),
      zone
    });

    for (let cons of [websiteBucket, distribution]) {
      cdk.Tag.add(cons, 'Project', props.project);
      cdk.Tag.add(cons, 'Environment', envName);
      cdk.Tag.add(cons, 'Owner', props.owner);
      cdk.Tag.add(cons, 'Issue', props.issue);
      cdk.Tag.add(cons, 'Name', domainName);
    }

    // Output CloudFront URL
    new cdk.CfnOutput(this, 'CloudFrontURL', {value: `https://${distribution.domainName}/`})
    // Output Distribution ID
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
  }
}

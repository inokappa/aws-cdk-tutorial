import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import cf = require('@aws-cdk/aws-cloudfront');
import iam = require('@aws-cdk/aws-iam');
import route53 = require('@aws-cdk/aws-route53');
import route53_targets = require('@aws-cdk/aws-route53-targets/lib');


export class Tutorial01Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const envName = this.node.tryGetContext('env');
    const domainName = this.node.tryGetContext('domain');

    // Create Bucket
    const websiteBucket = new s3.Bucket(this, `Tutorial01Infra-s3bucket-${this.stackName}`, {
      bucketName: domainName,
    });

    // Create CloudFront Origin Access Identity
    const OAI = new cf.CfnCloudFrontOriginAccessIdentity(this, `identity-${this.stackName}`,{
      cloudFrontOriginAccessIdentityConfig:{
        comment: `Tutorial01Infra-${this.stackName}`
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
        // ここは決め打ちごめんなさい
        acmCertRef: 'arn:aws:acm:us-east-1:01234567891:certificate/xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
        names: [domainName],
        sslMethod: cf.SSLMethod.SNI,
        securityPolicy: cf.SecurityPolicyProtocol.TLS_V1_1_2016,
      }
    });

    // mydomain.com を決め打ちでごめんなさい
    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: 'mydomain.com' });
    new route53.ARecord(this, `Tutorial01Infra-route53-record-${this.stackName}`, {
      recordName: domainName,
      target: route53.AddressRecordTarget.fromAlias(new route53_targets.CloudFrontTarget(distribution)),
      zone
    });

    for (let cons of [websiteBucket, distribution]) {
      cdk.Tag.add(cons, 'Environment', envName);
      cdk.Tag.add(cons, 'Name', domainName);
    }

    // Output CloudFront URL
    new cdk.CfnOutput(this, 'CloudFrontURL', {value: `https://${distribution.domainName}/`})
    // Output Distribution ID
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
  }
}

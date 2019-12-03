import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import Tutorial01 = require('../lib/tutorial01-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Tutorial01.Tutorial01Stack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
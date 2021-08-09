import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkUserCrud from '../lib/cdk-user-crud-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const props = {
        stage: '',
        openApi: '',
    };
    const stack = new CdkUserCrud.CdkUserCrudStack(app, 'MyTestStack', props);
    // THEN
    expectCDK(stack).to(
        matchTemplate(
            {
                Resources: {},
            },
            MatchStyle.EXACT
        )
    );
});

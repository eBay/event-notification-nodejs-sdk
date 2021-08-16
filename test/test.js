/*
 * *
 *  * Copyright 2021 eBay Inc.
 *  *
 *  * Licensed under the Apache License, Version 2.0 (the "License");
 *  * you may not use this file except in compliance with the License.
 *  * You may obtain a copy of the License at
 *  *
 *  *  http://www.apache.org/licenses/LICENSE-2.0
 *  *
 *  * Unless required by applicable law or agreed to in writing, software
 *  * distributed under the License is distributed on an "AS IS" BASIS,
 *  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  * See the License for the specific language governing permissions and
 *  * limitations under the License.
 *  *
 */

'use strict';

const expect = require('chai').expect;
const assert = require('chai').assert;
const nock = require('nock');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const EventNotificationSDK = require('../lib/index');
const testData = require('./test.json');

const hostname = 'https://api.ebay.com';
const identityApiPath = '/identity/v1/oauth2/token';
const notificationApiPath = '/commerce/notification/v1/public_key/';

const axiosMock = new MockAdapter(axios, { delayResponse: 100 });
const { createHash } = require('crypto');

const env = {
    production: 'PRODUCTION',
    sandbox: 'SANDBOX'
};

const sampleConfig = {
    'SANDBOX': {
        'clientId': 'clientId',
        'clientSecret': 'clientSecret',
        'devId': 'devId',
        'redirectUri': 'redirectUri',
        'baseUrl': 'api.sandbox.ebay.com'
    },
    'PRODUCTION': {
        'clientId': 'clientId',
        'clientSecret': 'clientSecret',
        'devId': 'devId',
        'redirectUri': 'redirectUri',
        'baseUrl': 'api.ebay.com'
    }
};

describe('Test Notification SDK', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    it('should export NotificationSDK as an object', () => {
        expect(EventNotificationSDK).to.be.a('object');
    });

    it('should export NotificationSDK.process() as an function', () => {
        expect(EventNotificationSDK.process).to.be.a('function');
    });

    it('should throw an error if message is not provided', async () => {
        try {
            await EventNotificationSDK.process();
        } catch (err) {
            expect(err.message).to.equal('Please provide the message.');
        }
    });

    it('should throw an error if message is missing metadata', async () => {
        try {
            await EventNotificationSDK.process({ notification: {} });
        } catch (err) {
            expect(err.message).to.equal('Please provide the message.');
        }
    });

    it('should throw an error if message is missing notification', async () => {
        try {
            await EventNotificationSDK.process({ metadata: {} });
        } catch (err) {
            expect(err.message).to.equal('Please provide the message.');
        }
    });

    it('should throw an error if signature is not provided', async () => {
        try {
            await EventNotificationSDK.process({ metadata: {}, notification: {} });
        } catch (err) {
            expect(err.message).to.equal('Please provide the message.');
        }
    });

    it('should throw an error if config is not provided', async () => {
        try {
            await EventNotificationSDK.process({ metadata: {}, notification: {} }, 'signature');
        } catch (err) {
            expect(err.message).to.equal('Please provide the config.');
        }
    });

    it('should throw an error if environment is not provided', async () => {
        try {
            await EventNotificationSDK.process({ metadata: {}, notification: {} },
                'signature', sampleConfig);
        } catch (err) {
            expect(err.message).to.equal('Please provide the environment.');
        }
    });

    it('should throw an error if Client ID is not provided', async () => {
        try {
            await EventNotificationSDK.process(
                { metadata: {}, notification: {} }, 'signature',
                {
                    PRODUCTION: { clientSecret: 'clientSecret' },
                    SANDBOX: { clientSecret: 'clientSecret' }
                }, env.production);
        } catch (err) {
            expect(err.message).to.equal('Please provide the Client ID.');
        }
    });

    it('should throw an error if Client Secret is not provided', async () => {
        try {
            await EventNotificationSDK.process(
                { metadata: {}, notification: {} }, 'signature',
                {
                    SANDBOX: { clientId: 'clientId' },
                    PRODUCTION: { clientId: 'clientId' }
                }, env.sandbox);
        } catch (err) {
            expect(err.message).to.equal('Please provide the Client Secret.');
        }
    });

    it('should throw an error if Environment is not provided', async () => {
        try {
            await EventNotificationSDK.process(
                { metadata: {}, notification: {} }, 'signature',
                {
                    PRODUCTION:
                    {
                        clientSecret: 'clientSecret',
                        clientId: 'clientId'
                    }
                }, env.production);
        } catch (err) {
            expect(err.message).to.equal('Please provide the Environment.');
        }
    });

    it('should return 204 for valid inputs', () => {
        axiosMock.onGet(`${hostname}${notificationApiPath}${testData.VALID.public_key}`)
            .reply(200,
                testData.VALID.response
            );

        // Mock token generation
        const tokenCallMock = nock(hostname);
        tokenCallMock.post(identityApiPath, {
            grant_type: 'client_credentials',
            scope: `${hostname}/oauth/api_scope`
        }).reply(200, {
            access_token: 'abcde'
        });

        EventNotificationSDK.process(testData.VALID.message,
            testData.VALID.signature,
            sampleConfig, env.production)
            .then((responseCode) => {
                expect(responseCode).to.equal(204);
            }).catch((ex) => {
                console.error(`Failed: ${ex}`);
            });
    });

    it('should return 412 when validation fails', () => {
        axiosMock.onGet(`${hostname}${notificationApiPath}${testData.INVALID.public_key}`)
            .reply(200,
                testData.INVALID.response
            );

        // Mock token generation
        const tokenCallMock = nock(hostname);
        tokenCallMock.post(identityApiPath, {
            grant_type: 'client_credentials',
            scope: `${hostname}/oauth/api_scope`
        }).reply(200, {
            access_token: 'abcde'
        });

        EventNotificationSDK.process(testData.INVALID.message,
            testData.INVALID.signature,
            sampleConfig, env.production)
            .then((responseCode) => {
                expect(responseCode).to.equal(412);
            }).catch((ex) => {
                console.error(`Failed: ${ex}`);
            });
    });

    it('should return 412 for signature mismatch', () => {
        axiosMock.onGet(`${hostname}${notificationApiPath}${testData.SIGNATURE_MISMATCH.public_key}`)
            .reply(200,
                testData.SIGNATURE_MISMATCH.response
            );

        // Mock token generation
        const tokenCallMock = nock(hostname);
        tokenCallMock.post(identityApiPath, {
            grant_type: 'client_credentials',
            scope: `${hostname}/oauth/api_scope`
        }).reply(200, {
            access_token: 'abcde'
        });

        EventNotificationSDK.process(testData.SIGNATURE_MISMATCH.message,
            testData.SIGNATURE_MISMATCH.signature, sampleConfig, env.production)
            .then((responseCode) => {
                expect(responseCode).to.equal(412);
            }).catch((ex) => {
                console.error(`Failed: ${ex}`);
            });
    });

    it('should return 500 when Notification API call fails', () => {
        axiosMock.onGet(`${hostname}${notificationApiPath}${testData.ERROR.public_key}`)
            .reply(500,
                testData.ERROR.response
            ).onAny().reply(500);

        // Mock token generation
        const tokenCallMock = nock(hostname);
        tokenCallMock.post(identityApiPath, {
            grant_type: 'client_credentials',
            scope: `${hostname}/oauth/api_scope`
        }).reply(200, {
            access_token: 'abcde'
        });

        EventNotificationSDK.process(testData.ERROR.message,
            testData.ERROR.signature, sampleConfig, env.production)
            .then((responseCode) => {
                assert.equal(responseCode, 500);
            }).catch((ex) => {
                console.error(`Failed: ${ex}`);
            });
    });

    it('should return 500 when API OAuth token call fails', () => {
        axiosMock.onGet(`${hostname}${notificationApiPath}${testData.ERROR.public_key}`)
            .reply(500,
                testData.ERROR.response
            );

        // Mock token generation
        const tokenCallMock = nock(hostname);
        tokenCallMock.post(identityApiPath, {
            grant_type: 'client_credentials',
            scope: `${hostname}/oauth/api_scope`
        }).reply(500, null);

        EventNotificationSDK.process(testData.SIGNATURE_MISMATCH.message,
            testData.SIGNATURE_MISMATCH.signature, sampleConfig, env.production)
            .then((responseCode) => {
                assert.equal(responseCode, 500);
            }).catch((ex) => {
                console.error(`Failed: ${ex}`);
            });
    });

    it('should return the correct challenge response', () => {
        const challengeCode = '71745723-d031-455c-bfa5-f90d11b4f20a';
        const config = {
            endpoint: 'http://www.testendpoint.com/webhook',
            verificationToken: '71745723-d031-455c-bfa5-f90d11b4f20a'
        };

        const hash = createHash('sha256');

        hash.update(challengeCode);
        hash.update(config.verificationToken);
        hash.update(config.endpoint);

        const responseHash = hash.digest('hex');
        const expectedResponse = Buffer.from(responseHash).toString();

        const challengeResponse = EventNotificationSDK.validateEndpoint(
            challengeCode,
            config);

        assert.equal(expectedResponse, challengeResponse);
    });

    it('should return error if verificationToken is missing', () => {
        const challengeCode = '71745723-d031-455c-bfa5-f90d11b4f20a';
        const config = {
            endpoint: 'http://www.testendpoint.com/webhook'
        };

        try {
            EventNotificationSDK.validateEndpoint(
                challengeCode,
                config);
            assert.fail('Expected exception');
        } catch (ex) {
            assert.equal('The "verificationToken" is required.', ex.message);
        }
    });

    it('should return error if endpoint is missing', () => {
        const challengeCode = '71745723-d031-455c-bfa5-f90d11b4f20a';
        const config = {
            verificationToken: '71745723-d031-455c-bfa5-f90d11b4f20a'
        };

        try {
            EventNotificationSDK.validateEndpoint(
                challengeCode,
                config);
            assert.fail('Expected exception');
        } catch (ex) {
            assert.equal('The "endpoint" is required.', ex.message);
        }
    });

    it('should return error if endpoint is missing', () => {
        const config = {
            endpoint: 'http://www.testendpoint.com/webhook',
            verificationToken: '71745723-d031-455c-bfa5-f90d11b4f20a'
        };

        try {
            EventNotificationSDK.validateEndpoint(
                null,
                config);
            assert.fail('Expected exception');
        } catch (ex) {
            assert.equal('The "challengeCode" is required.', ex.message);
        }
    });
});


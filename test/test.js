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

const sampleConfig = {
    clientId: 'clientId',
    clientSecret: 'clientSecret',
    environment: 'PRODUCTION'
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

    it('should throw an error if Client ID is not provided', async () => {
        try {
            await EventNotificationSDK.process(
                { metadata: {}, notification: {} }, 'signature',
                { clientSecret: 'clientSecret', environment: 'PRODUCTION' });
        } catch (err) {
            expect(err.message).to.equal('Please provide the Client ID.');
        }
    });

    it('should throw an error if Client Secret is not provided', async () => {
        try {
            await EventNotificationSDK.process(
                { metadata: {}, notification: {} }, 'signature',
                { clientId: 'clientId', environment: 'PRODUCTION' });
        } catch (err) {
            expect(err.message).to.equal('Please provide the Client Secret.');
        }
    });

    it('should throw an error if Environment is not provided', async () => {
        try {
            await EventNotificationSDK.process(
                { metadata: {}, notification: {} }, 'signature',
                { clientSecret: 'clientSecret', clientId: 'clientId' });
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
            sampleConfig)
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
            sampleConfig)
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
            testData.SIGNATURE_MISMATCH.signature, sampleConfig)
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
            testData.ERROR.signature, sampleConfig)
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
            testData.SIGNATURE_MISMATCH.signature, sampleConfig)
            .then((responseCode) => {
                assert.equal(responseCode, 500);
            }).catch((ex) => {
                console.error(`Failed: ${ex}`);
            });
    });
});


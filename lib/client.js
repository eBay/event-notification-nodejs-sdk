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

const axios = require('axios');
const EbayAuthToken = require('ebay-oauth-nodejs-client');
const LRU = require('lru-cache'),
    cache = new LRU(100);

const constants = require('./constants');

/**
 * Uses the eBay  OAuth client to get app token
 * @param {String} environment
 * @returns Application token
 */
const getAppToken = async (config) => {
    try {
        const ebayAuthToken = new EbayAuthToken({
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            env: config.environment,
            redirectUri: ''
        });

        const token = await ebayAuthToken.getApplicationToken(config.environment);
        return token && JSON.parse(token);
    } catch (error) {
        console.error(error);
        throw error;
    }
};

/**
 * Look for the Public key in cache, if not found call eBay Notification API
 *
 * @param {String} keyId
 * @param {JSON} config
 * @returns {String} Public key
 */
const getPublicKey = async (keyId, config) => {
    const publicKey = cache.get(keyId);

    if (publicKey) {
        return publicKey;
    }

    try {
        const notificationApiEndpoint = (config.environment === constants.ENVIRONMENT.SANDBOX) ?
            constants.NOTIFICATION_API_ENDPOINT_SANDBOX : constants.NOTIFICATION_API_ENDPOINT_PRODUCTION;
        const tokenResponse = await getAppToken(config);
        const uri = `${notificationApiEndpoint}${keyId}`;
        const requestConfig = {
            method: 'GET',
            url: uri,
            headers: {
                Authorization: `${constants.BEARER}${tokenResponse.access_token}`,
                'Content-Type': `${constants.HEADERS.APPLICATION_JSON}`
            }
        };

        const notificationApiResponse = await axios(requestConfig);

        if (!notificationApiResponse
            || notificationApiResponse.status !== constants.HTTP_STATUS_CODE.OK) {
            throw new Error(`Public key retrieval failed with ${notificationApiResponse.status} for ${uri}`);
        }
        cache.set(keyId, notificationApiResponse.data);
        return notificationApiResponse.data;
    } catch (error) {
        throw error;
    }
};

module.exports = { getPublicKey };

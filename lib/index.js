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

const validator = require('./validator');
const constants = require('./constants');
const processor = require('./processor/processor');

/**
 * Validate the signature and process the message
 *
 * @param {JSON} message
 * @param {String} signature
 * @param {JSON} config
 * @param {String} environment
 */
const process = async (message, signature, config, environment) => {
    try {
        // Validate the input
        if (!message || !message.metadata || !message.notification) throw new Error('Please provide the message.');
        if (!signature) throw new Error('Please provide the signature.');
        if (!config) throw new Error('Please provide the config.');
        if (!config.PRODUCTION.clientId && !config.SANDBOX.clientId) {
            throw new Error('Please provide the Client ID.');
        }
        if (!config.PRODUCTION.clientSecret && !config.SANDBOX.clientSecret) {
            throw new Error('Please provide the Client secret.');
        }
        if (!environment
            || (environment !== constants.ENVIRONMENT.PRODUCTION
                && environment !== constants.ENVIRONMENT.SANDBOX)) {
            throw new Error('Please provide the Environment.');
        }

        // Build the config
        let envConfig = {};
        if (environment === constants.ENVIRONMENT.SANDBOX) {
            envConfig = config.SANDBOX;
            envConfig.environment = constants.ENVIRONMENT.SANDBOX;
        } else {
            envConfig = config.PRODUCTION;
            envConfig.environment = constants.ENVIRONMENT.PRODUCTION;
        }

        const response = await validator.validateSignature(message, signature, envConfig);
        if (response) {
            // Get the appropriate processor to process the message
            processor
                .getProcessor(message.metadata.topic)
                .process(message);
            return constants.HTTP_STATUS_CODE.NO_CONTENT;
        }
        return constants.HTTP_STATUS_CODE.PRECONDITION_FAILED;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        return constants.HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR;
    }
};

/**
 * Generates challenge response
 *
 * @param {String} challengeCode
 * @param {JSON} config
 * @returns {String} challengeResponse
 */
const validateEndpoint = (challengeCode, config) => {
    if (!challengeCode) throw new Error('The "challengeCode" is required.');
    if (!config) throw new Error('Please provide the config.');
    if (!config.endpoint) throw new Error('The "endpoint" is required.');
    if (!config.verificationToken) throw new Error('The "verificationToken" is required.');

    try {
        return validator.generateChallengeResponse(challengeCode, config);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
    }
};

module.exports = {
    process,
    validateEndpoint
};

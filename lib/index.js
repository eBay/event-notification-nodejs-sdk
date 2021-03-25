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
 */
module.exports.process = async (message, signature, config) => {
    try {
        // Validate the input
        if (!message || !message.metadata || !message.notification) throw new Error('Please provide the message.');
        if (!signature) throw new Error('Please provide the signature.');
        if (!config) throw new Error('Please provide the config.');
        if (!config.clientId) throw new Error('Please provide the Client ID.');
        if (!config.clientSecret) throw new Error('Please provide the Client secret.');
        if (!config.environment
            || (config.environment !== constants.ENVIRONMENT.PRODUCTION
                && config.environment !== constants.ENVIRONMENT.SANDBOX)) {
            throw new Error('Please provide the Environment.');
        }

        const response = await validator.validateSignature(message, signature, config);
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

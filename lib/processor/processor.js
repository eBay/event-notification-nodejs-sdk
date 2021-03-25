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

const topics = require('../constants').TOPICS;
const accountDeletionMessageProcessor = require('./accountDeletionMessageProcessor');

/**
 * Get the Processor for the given topic
 *
 * @param {String} topic
 */
const getProcessor = (topic) => {
    switch (topic) {
        case topics.MARKETPLACE_ACCOUNT_DELETION:
            return accountDeletionMessageProcessor;
        default:
            // eslint-disable-next-line no-throw-literal
            throw `Message processor not registered for: ${topic}`;
    }
};

module.exports = { getProcessor };

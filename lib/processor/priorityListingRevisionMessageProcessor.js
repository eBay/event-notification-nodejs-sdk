/*
 * *
 *  * Copyright 2023 eBay Inc.
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

/**
 * Process the message
 *
 * @param {JSON} message
 */
const processInternal = (message) => {
    const data = message.notification.data;
    console.log(`\n==========================\PriorityListingRevision Date :` + JSON.stringify(data, null, 2))
};

module.exports = { process: processInternal };

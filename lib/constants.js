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

module.exports = {
    ALGORITHM: 'ssl3-sha1',
    AUTHORIZATION: 'Authorization',
    BASE64: 'base64',
    BEARER: 'bearer ',
    ENVIRONMENT: {
        SANDBOX: 'SANDBOX',
        PRODUCTION: 'PRODUCTION'
    },
    HEADERS: {
        APPLICATION_JSON: 'application/json'
    },
    HEX: 'hex',
    HTTP_STATUS_CODE: {
        NO_CONTENT: 204,
        OK: 200,
        PRECONDITION_FAILED: 412,
        INTERNAL_SERVER_ERROR: 500
    },
    KEY_END: '-----END PUBLIC KEY-----',
    KEY_PATTERN_END: /-----END PUBLIC KEY-----/,
    KEY_PATTERN_START: /-----BEGIN PUBLIC KEY-----/,
    KEY_START: '-----BEGIN PUBLIC KEY-----',
    NOTIFICATION_API_ENDPOINT_PRODUCTION: 'https://api.ebay.com/commerce/notification/v1/public_key/',
    NOTIFICATION_API_ENDPOINT_SANDBOX: 'https://api.sandbox.ebay.com/commerce/notification/v1/public_key/',
    SHA256: 'sha256',
    TOPICS: {
        MARKETPLACE_ACCOUNT_DELETION: 'MARKETPLACE_ACCOUNT_DELETION'
    },
    X_EBAY_SIGNATURE: 'x-ebay-signature'
};

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

/* eslint-disable no-console */
/* eslint-disable max-len */

'use strict';

const express = require('express');
const app = express();

const config = require('./config.json');
const constants = require('../lib/constants');
const EventNotificationSDK = require('../lib/index');

const environment = 'PRODUCTION';
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.post('/webhook', (req, res) => {
    EventNotificationSDK.process(
        req.body,
        req.headers[constants.X_EBAY_SIGNATURE],
        config,
        environment
    ).then((responseCode) => {
        if (responseCode === constants.HTTP_STATUS_CODE.NO_CONTENT) {
            console.log(`Message processed successfully for: \n- Topic: ${req.body.metadata.topic} \n- NotificationId: ${req.body.notification.notificationId}\n`);
        } else if (responseCode === constants.HTTP_STATUS_CODE.PRECONDITION_FAILED) {
            console.error(`Signature mismatch for: \n- Payload: ${JSON.stringify(req.body)} \n- Signature: ${req.headers[constants.X_EBAY_SIGNATURE]}\n`);
        }
        res.status(responseCode).send();
    }).catch((ex) => {
        console.error(`Signature validation processing failure: ${ex}\n`);
        res.status(constants.HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).send();
    });
});

app.get('/webhook', (req, res) => {
    if (req.query.challenge_code) {
        try {
            const challengeResponse = EventNotificationSDK.validateEndpoint(
                req.query.challenge_code,
                config);
            res.status(200).send({
                challengeResponse: challengeResponse
            });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(`Endpoint validation failure: ${e}`);
            res.status(constants.HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).send();
        }
    } else {
        res.status(constants.HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).send();
    }
});

app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Listening at http://localhost:${PORT}`);
});

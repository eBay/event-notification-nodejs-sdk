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

const crypto = require('crypto');

const client = require('./client');
const constants = require('./constants');

/**
 * Base64 decode and return
 *
 * @param {String} signatureHeader
 */
const getXeBaySignatureHeader = (signatureHeader) => {
    const buffer = Buffer.from(signatureHeader, constants.BASE64);
    const signatureHeaderString = buffer.toString('ascii');
    try {
        return JSON.parse(signatureHeaderString);
    } catch (exception) {
        throw new Error(`Parsing falied for signature header ${signatureHeader}`);
    }
};

/**
 * Formats the public key
 *
 * @param {String} key
 */
const formatKey = (key) => {
    try {
        const updatedKey = key.replace(constants.KEY_PATTERN_START, `${constants.KEY_START}\n`);
        return updatedKey.replace(constants.KEY_PATTERN_END, `\n${constants.KEY_END}`);
    } catch (exception) {
        throw new Error(`Invalid key format`);
    }
};

/**
 * Validate the signature
 * 1. Base64 decode signatureHeader and parse it as JSON
 * 2. Get the public for keyId from cache or call eBay Notification API
 * 3. Use crypto library to verify the message
 *
 * @param {JSON} message
 * @param {String} signatureHeader
 * @param {JSON} config
 */
const validateSignature = async (message, signatureHeader, config) => {
    try {
        // Base64 decode the signatureHeader and convert to JSON
        const xeBaySignature = getXeBaySignatureHeader(signatureHeader);

        // Get the public key
        const publicKey = await client.getPublicKey(xeBaySignature.kid, config);

        // Init verifier
        const verifier = crypto.createVerify(constants.ALGORITHM);

        verifier.update(JSON.stringify(message));

        return verifier.verify(formatKey(publicKey.key),
            xeBaySignature.signature, constants.BASE64);
    } catch (exception) {
        throw exception;
    }
};

/**
 * Generates challenge response
 * 1. Hash the challengeCode, verificationToken and endpoint
 * 2. Convert to hex
 *
 * @param {String} challengeCode
 * @param {JSON} config
 * @returns {String} challengeResponse
 */
const generateChallengeResponse = (challengeCode, config) => {
    try {
        const hash = crypto.createHash(constants.SHA256);

        hash.update(challengeCode);
        hash.update(config.verificationToken);
        hash.update(config.endpoint);

        const responseHash = hash.digest(constants.HEX);
        return Buffer.from(responseHash).toString();
    } catch (exception) {
        throw exception;
    }
};

module.exports = {
    generateChallengeResponse,
    validateSignature
};

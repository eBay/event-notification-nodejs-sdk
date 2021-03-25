# Event Notification SDK

With notifications, business moments are communicated to all interested listeners a.k.a. subscribers of those event streams. eBay's most recent notification payloads are also secured using ECC signature headers.

This NodeJS SDK is designed to simplify processing eBay notifications. The application receives subscribed messages, validates the integrity of the message using the X-EBAY-SIGNATURE header and delegates to a custom configurable MessageProcessor for plugging in usecase specific processing logic.

# Table of contents
* [What Notifications are covered?](#notifications)
* [Motivation](#motivation)
* [Usage](#usage)
* [Logging](#logging)
* [License](#license)

# Notifications

This SDK is intended for the latest eBay notifications that use ECC signatures and JSON payloads.
While this SDK is generic for any topic, it currently includes the schema definition for MARKETPLACE_ACCOUNT_DELETION notifications.

# Motivation

This SDK is intended to bootstrap subscriptions to eBay Notifications and provides a ready NodeJS example.

This SDK incorporates

- A deployable example NodeJS application that is generic across topics and can process incoming https notifications
- Allows registration of custom Message Processors.
- Verify the integrity of the incoming messages
  - Use key id from the decoded signature header to fetch public key required by the verification algorithm. An LRU cache is used to prevent refetches for same 'key'.
  - On verification success, delegate processing to the registered custom message processor and respond with a 204 HTTP status code.
  - On verification failure, respond back with a 412 HTTP status code

# Usage

**Prerequisites**

```
NodeJS: v12.16 or higher
NPM: v7.5.6 or higher
```

**Install**
Using npm:

```shell
npm install event-notification-nodejs-sdk
```

Using yarn:

```shell
yarn add event-notification-nodejs-sdk
```

**Configure**

```
* Update config.js with path to client credentials (required to fetch Public Key from /commerce/notification/v1/public_key/{public_key_id}).
* Specify environment (PRODUCTION or SANDBOX).

For MARKETPLACE_ACCOUNT_DELETION use case simply implement custom logic in accountDeletionMessageProcessor.processInternal()
```

**Onboard any new topic in 3 simple steps! :**

- Add the new topic constant to [constants.js](lib/constants.js)
- Add a custom message processor for the new topic in `lib/processor/`
- Update the [processor.js](lib/processor/processor.js) to return the new message processor for the topic

Note: You can refer to [example.js](examples/example.js) for an example of how to setup an express server and use the SDK.

**Running the example**

Using npm:

```shell
npm start
```

Using yarn:

```shell
yarn start
```

Client Credentials Configuration Sample: [config.js](examples/config.js).

**Note for Production deployment**

```
For production, please host with HTTPS enabled.
```

# Logging

Uses standard console logging.

# License

Copyright 2021 eBay Inc.
Developer: Lokesh Rishi

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

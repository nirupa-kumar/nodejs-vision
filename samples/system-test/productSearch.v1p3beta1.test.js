/**
 * Copyright 2018, Google, LLC.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const path = require(`path`);
const uuid = require(`uuid`);
const vision = require('@google-cloud/vision').v1p3beta1;
const productSearchClient = new vision.ProductSearchClient();
const assert = require('assert');
const tools = require(`@google-cloud/nodejs-repo-tools`);
const cmd = `node productSearch.v1p3beta1.js`;
const cwd = path.join(__dirname, `..`, `productSearch`);

// Shared fixture data for product tests
const testProductSet = {
  projectId: process.env.GCLOUD_PROJECT,
  location: 'us-west1',
  productCategory: 'homegoods',
  productId: `test_product_id${uuid.v4()}`,
  productDisplayName: 'test_product_display_name_1',
  productSetId: `test_product_set_id${uuid.v4()}`,
  productSetDisplayName: 'test_product_set_display_name_1',
};

testProductSet.productSetPath = productSearchClient.productSetPath(
  testProductSet.projectId,
  testProductSet.location,
  testProductSet.productSetId
);

testProductSet.createdProductPaths = [];
testProductSet.createdProductSetPaths = [];

describe(`product search`, () => {
  before(tools.checkCredentials);

  before(async () => {
    // Create a test product set for each test
    try {
      await productSearchClient.createProduct({
        parent: productSearchClient.locationPath(
          testProductSet.projectId,
          testProductSet.location
        ),
        productId: testProductSet.productId,
        product: {
          displayName: testProductSet.productDisplayName,
          productCategory: testProductSet.productCategory,
        },
      });
      testProductSet.createdProductPaths.push(testProductSet.productPath);
    } catch (err) {
      throw err;
    }

    try {
      await productSearchClient.createProductSet({
        parent: productSearchClient.locationPath(
          testProductSet.projectId,
          testProductSet.location
        ),
        productSetId: testProductSet.productSetId,
        productSet: {
          displayName: testProductSet.productSetDisplayName,
        },
      });
      testProductSet.createdProductSetPaths.push(
        testProductSet.createdProductSetPaths
      );
    } catch (err) {
      throw err;
    }
  });

  after(async () => {
    // Delete products sets after each test
    testProductSet.createdProductSetPaths.forEach(async path => {
      try {
        await productSearchClient.deleteProductSet({name: path});
        await productSearchClient.deleteProduct({name: path});
      } catch (err) {} // ignore error
    });
  });

  it(`should add product to product set`, async () => {
    const output = await tools.runAsync(
      `${cmd} addProductToProductSet "${testProductSet.projectId}" "${
        testProductSet.location
      }" "${testProductSet.productId}" "${testProductSet.productSetId}"`,
      cwd
    );

    assert.ok(output.includes(`Product added to product set.`));
  });

  it(`should remove a product from a product set`, async () => {
    const output = await tools.runAsync(
      `${cmd} removeProductFromProductSet "${testProductSet.projectId}" "${
        testProductSet.location
      }" "${testProductSet.productId}" "${testProductSet.productSetId}"`,
      cwd
    );

    assert.ok(output.includes(`Product removed from product set.`));
  });
});

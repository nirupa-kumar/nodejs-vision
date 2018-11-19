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
const productSearch = new vision.ProductSearchClient();
const assert = require('assert');
const tools = require(`@google-cloud/nodejs-repo-tools`);
const cmd = `node products.v1p3beta1.js`;
const cwd = path.join(__dirname, `..`, `productSearch`);

// Shared fixture data for product tests
const testProduct = {
  projectId: 'nodejs-docs-samples',
  location: 'us-west1',
  productId: 'test_products_id_01',
  productDisplayName: 'test_product_display_name_1',
  productCategory: 'homegoods',
  productKey: 'myKey',
  productValue: 'myValue',
};
testProduct.productPath = productSearch.productPath(
  testProduct.projectId,
  testProduct.location,
  testProduct.productId
);

// Helper function: returns product if exists else false
async function getProductOrFalse(productPath) {
  try {
    const response = await productSearch.getProduct({name: productPath});
    return response[0];
  } catch (err) {
    if (err.message.includes('Not found')) {
      return false;
    } else {
      throw err;
    }
  }
}

describe(`products`, () => {
  before(tools.checkCredentials);

  it(`should create product`, async () => {
    const newProductId = `ProductId${uuid.v4()}`;
    const newProductPath = productSearch.productPath(
      testProduct.projectId,
      testProduct.location,
      newProductId
    );
    assert.strictEqual(await getProductOrFalse(newProductPath), false);

    let output = await tools.runAsync(
      `${cmd} createProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}" "${testProduct.productDisplayName}" "${
        testProduct.productCategory
      }"`,
      cwd
    );

    assert.ok(output.includes(`Product name: ${newProductPath}`));

    const newProduct = await getProductOrFalse(newProductPath);
    assert.ok(newProduct.displayName === testProduct.productDisplayName);
    assert.ok(newProduct.productCategory === testProduct.productCategory);

    output = await tools.runAsync(
      `${cmd} deleteProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}"`,
      cwd
    );
    assert.ok(output.includes(`Product deleted.`));
  });

  it(`should get product`, async () => {
    const newProductId = `ProductId${uuid.v4()}`;
    const newProductPath = productSearch.productPath(
      testProduct.projectId,
      testProduct.location,
      newProductId
    );
    assert.strictEqual(await getProductOrFalse(newProductPath), false);
    let output = await tools.runAsync(
      `${cmd} createProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}" "${testProduct.productDisplayName}" "${
        testProduct.productCategory
      }"`,
      cwd
    );

    assert.ok(output.includes(`Product name: ${newProductPath}`));

    output = await tools.runAsync(
      `${cmd} getProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}"`,
      cwd
    );

    assert.ok(output.includes(`Product name: ${newProductPath}`));
    assert.ok(output.includes(`Product id: ${newProductId}`));
    assert.ok(output.includes(`Product display name:`));
    assert.ok(output.includes(`Product description:`));
    assert.ok(
      output.includes(`Product category: ${testProduct.productCategory}`)
    );
    assert.ok(output.includes(`Product labels:`));

    output = await tools.runAsync(
      `${cmd} deleteProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}"`,
      cwd
    );
    assert.ok(output.includes(`Product deleted.`));
  });

  it(`should list products`, async () => {
    const output = await tools.runAsync(
      `${cmd} listProducts "${testProduct.projectId}" "${
        testProduct.location
      }"`,
      cwd
    );

    assert.ok(output.includes(`Product id: indexed_product_id_for_testing_1`));
    assert.ok(output.includes(`Product labels:`));
  });

  it(`should delete product`, async () => {
    const newProductId = `ProductId${uuid.v4()}`;
    const newProductPath = productSearch.productPath(
      testProduct.projectId,
      testProduct.location,
      newProductId
    );
    assert.strictEqual(await getProductOrFalse(newProductPath), false);
    let output = await tools.runAsync(
      `${cmd} createProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}" "${testProduct.productDisplayName}" "${
        testProduct.productCategory
      }"`,
      cwd
    );

    assert.ok(output.includes(`Product name: ${newProductPath}`));

    output = await tools.runAsync(
      `${cmd} deleteProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}"`,
      cwd
    );
    assert.ok(output.includes(`Product deleted.`));

    try {
      await productSearch.getProduct({name: `${newProductPath}`});
      assert.fail('Product was not deleted');
    } catch (err) {
      assert.ok(err.message.includes('Not found'));
    }
  });

  it(`should update product label`, async () => {
    const newProductId = `ProductId${uuid.v4()}`;
    const newProductPath = productSearch.productPath(
      testProduct.projectId,
      testProduct.location,
      newProductId
    );
    let output = await tools.runAsync(
      `${cmd} createProduct "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}" "${testProduct.productDisplayName}" "${
        testProduct.productCategory
      }"`,
      cwd
    );

    assert.ok(output.includes(`Product name: ${newProductPath}`));
    output = await tools.runAsync(
      `${cmd} updateProductLabels "${testProduct.projectId}" "${
        testProduct.location
      }" "${newProductId}" "${testProduct.productKey}" "${
        testProduct.productValue
      }"`,
      cwd
    );

    assert.ok(
      output.includes(
        `Product Labels: ${testProduct.productKey}: ${testProduct.productValue}`
      )
    );
    assert.ok(
      output.includes(`Product display name: ${testProduct.productDisplayName}`)
    );
    assert.ok(output.includes(`Product description:`));
    assert.ok(
      output.includes(`Product category: ${testProduct.productCategory}`)
    );
  });
});

// Copyright 2021, Nitric Technologies Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { snippy, Snippy } from './snippy';
import fetch from 'isomorphic-unfetch';

jest.mock('isomorphic-unfetch');

describe('Snippy Client Tests', () => {
  describe('processSnippet method', () => {
    test('Test that the processSnippet method produces correct snippet with typescript', async () => {
      const fileContentsTypescript = `
        // [START import]
        import { documents } from '@nitric/sdk';
        // [END import]

        export async function getDocument() {
          // [START snippet]
          const documentRef = documents().collection('products').doc('nitric');

          const product = await documentRef.get();

          return product;
          // [END snippet]
        }
    `;

      expect(
        Snippy.processSnippet(fileContentsTypescript.trim(), 'get-document.ts')
      ).toEqual({
        name: 'get-document.ts',
        lang: 'typescript',
        content:
          "import { documents } from '@nitric/sdk';\n\nconst documentRef = documents().collection('products').doc('nitric');\n\nconst product = await documentRef.get();\n\nreturn product;",
        lineNumbers: [7, 11],
      });
    });

    test('Test that the processSnippet method produces correct snippet with python', async () => {
      const fileContentsPython = `
  # [START import]
  from nitric.api import Documents
  # [END import]

  # [START snippet]
  docs = Documents()

  document = docs.collection("products").doc("nitric")

  product = await document.get()
  # [END snippet]
  `;

      expect(
        Snippy.processSnippet(fileContentsPython.trim(), 'get-document.py')
      ).toEqual({
        name: 'get-document.py',
        lang: 'python',
        content:
          'from nitric.api import Documents\n\ndocs = Documents()\n\ndocument = docs.collection("products").doc("nitric")\n\nproduct = await document.get()',
        lineNumbers: [6, 10],
      });
    });

    test('Test that the processSnippet method produces correct snippet with no snippet at EOF', async () => {
      const fileContentsPython = `
  # [START import]
  from nitric.api import Documents
  # [END import]

  # [START snippet]
  docs = Documents()

  document = docs.collection("products").doc("nitric")

  product = await document.get()`;

      expect(
        Snippy.processSnippet(fileContentsPython.trim(), 'get-document.py')
      ).toEqual({
        name: 'get-document.py',
        lang: 'python',
        content:
          'from nitric.api import Documents\n\ndocs = Documents()\n\ndocument = docs.collection("products").doc("nitric")\n\nproduct = await document.get()',
        lineNumbers: [6, 9],
      });
    });
  });

  describe('parse method', () => {
    test('should return correct manifest', async () => {
      const snippyClient = snippy({
        repos: [
          {
            url: 'nitrictech/snippet-spike',
            ext: 'ts',
          },
        ],
      });

      jest
        .spyOn(snippyClient['octokit'].rest.search as any, 'code')
        .mockResolvedValue({
          data: {
            total_count: 1,
            incomplete_results: false,
            items: [
              {
                name: 'get-document.ts',
                path: 'get-document.ts',
                url: 'https://api.github.com/repositories/392195051/contents/get-document.ts?ref=f678b64f0c4b905ac6b3360f95ce0397d800bfe0',
                git_url:
                  'https://api.github.com/repositories/392195051/git/blobs/d80003395c7f32d72dde79b3f536f928ab03da59',
                html_url:
                  'https://github.com/nitrictech/snippet-spike/blob/f678b64f0c4b905ac6b3360f95ce0397d800bfe0/get-document.ts',
                repository: {
                  name: 'snippet-spike',
                  full_name: 'nitrictech/snippet-spike',
                  owner: {
                    login: 'nitrictech',
                  },
                  html_url: 'https://github.com/nitrictech/snippet-spike',
                  description: null,
                  fork: false,
                  url: 'https://api.github.com/repos/nitrictech/snippet-spike',
                },
                score: 1,
              },
            ],
          },
        });

      (fetch as any).mockResolvedValue({
        text: () =>
          "import { grpc } from '@nitric/sdk';\n\n// [START import]\nimport { documents } from '@nitric/sdk';\n// [END import]\n\nconst proto = grpc.document.DocumentServiceClient.prototype;\n\nconst MOCKED_GET_RESPONSE = {\n  hasDocument: () => true,\n  getDocument: () => ({\n    getContent: () => ({\n      toJavaScript: () => true,\n    }),\n  }),\n};\n\ntest('Should get a documents content', async () => {\n  jest\n    .spyOn(proto, 'get')\n    .mockImplementation((_, cb: any) => cb(null, MOCKED_GET_RESPONSE));\n\n  // [START snippet]\n  const document = documents().collection('products').doc('nitric');\n\n  const product = await document.get();\n  // [END snippet]\n});\n",
      });

      await expect(snippyClient.parse()).resolves.toEqual({
        'get-document.ts': {
          name: 'get-document.ts',
          lang: 'typescript',
          content:
            "import { documents } from '@nitric/sdk';\n\nconst document = documents().collection('products').doc('nitric');\n\nconst product = await document.get();",
          lineNumbers: [24, 26],
          url: 'https://github.com/nitrictech/snippet-spike/blob/f678b64f0c4b905ac6b3360f95ce0397d800bfe0/get-document.ts#L24-L26',
        },
      });
    });
  });
});

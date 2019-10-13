export const Repository = {
  "services": [
    {
      "name": "setup",
      "module": "/repository",
      "arguments": [
        {
          "name": "settings",
          "type": "RepositorySettings"
        }
      ],
      "returnType": "any"
    },
    {
      "name": "signIn",
      "module": "/repository",
      "arguments": [
        {
          "name": "account",
          "type": "Account"
        },
        {
          "name": "password",
          "type": "string"
        }
      ],
      "returnType": "string"
    },
    {
      "name": "signOut",
      "module": "/repository",
      "arguments": [
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "any"
    },
    {
      "name": "signUp",
      "module": "/repository",
      "arguments": [
        {
          "name": "username",
          "type": "string"
        },
        {
          "name": "password",
          "type": "string"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "string"
    },
    {
      "name": "createOrUpdateApplication",
      "module": "/repository",
      "arguments": [
        {
          "name": "application",
          "type": "Application"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "any"
    },
    {
      "name": "queryApplication",
      "module": "/repository",
      "arguments": [
        {
          "name": "application",
          "type": "Application|{id"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "any"
    },
    {
      "name": "deleteApplication",
      "module": "/repository",
      "arguments": [
        {
          "name": "application",
          "type": "Application"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "any"
    },
    {
      "name": "queryService",
      "module": "/repository",
      "arguments": [
        {
          "name": "service",
          "type": "Service"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "Service|null"
    },
    {
      "name": "createOrUpdateService",
      "module": "/repository",
      "arguments": [
        {
          "name": "service",
          "type": "Service"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "Service|null"
    },
    {
      "name": "deleteService",
      "module": "/repository",
      "arguments": [
        {
          "name": "service",
          "type": "Service"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "any"
    },
    {
      "name": "querySource",
      "module": "/repository",
      "arguments": [
        {
          "name": "source",
          "type": "Source"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "Source|null"
    },
    {
      "name": "createOrUpdateSource",
      "module": "/repository",
      "arguments": [
        {
          "name": "source",
          "type": "Source"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "Source|null"
    },
    {
      "name": "deleteSource",
      "module": "/repository",
      "arguments": [
        {
          "name": "source",
          "type": "Source"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "any"
    },
    {
      "name": "fetchServiceRuntime",
      "module": "/repository",
      "arguments": [
        {
          "name": "serviceIdentity",
          "type": "any"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "any"
    },
    {
      "name": "resourceHeartbeat",
      "module": "/repository",
      "arguments": [
        {
          "name": "data",
          "type": "any"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "any"
    },
    {
      "name": "updateResourceInfo",
      "module": "/repository",
      "arguments": [
        {
          "name": "data",
          "type": "any"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "any"
    },
    {
      "name": "deployServices",
      "module": "/repository",
      "arguments": [
        {
          "name": "data",
          "type": "any"
        },
        {
          "name": "token",
          "type": "string"
        }
      ],
      "returnType": "any"
    }
  ],
  "application": "sardines"
}
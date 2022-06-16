/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/users": {
    get: operations["usersGet"];
    post: operations["usersPost"];
  };
}

export interface components {
  schemas: {
    UserCreate: {
      /**
       * @description Name of the user
       * @example Jack Daniels
       */
      name: string;
      /** @description Age of user */
      age: number;
    };
    User: {
      id: components["schemas"]["UserID"];
      createdAt: components["schemas"]["Timestamp"];
      updatedAt: components["schemas"]["Timestamp"];
    } & components["schemas"]["UserCreate"];
    /**
     * Format: date-time
     * @description An ISO formatted Timestamp
     */
    Timestamp: Date | string;
    /** @description Unique identifier for a user */
    UserID: string;
  };
}

export interface operations {
  usersGet: {
    parameters: {
      query: {
        /** Search for users by name */
        q?: string;
        /** Fetch users by ID */
        id?: components["schemas"]["UserID"][];
        count?: number;
        /** Fetch users before this cursor */
        page?: string;
      };
    };
    responses: {
      /** OK */
      200: {
        content: {
          "application/json": {
            users: components["schemas"]["User"][];
            /** @description Use to fetch the next page */
            nextPageCursor?: string;
          };
        };
      };
    };
  };
  usersPost: {
    responses: {
      /** Created */
      200: {
        content: {
          "application/json": components["schemas"]["User"];
        };
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["UserCreate"];
      };
    };
  };
}

export interface external {}

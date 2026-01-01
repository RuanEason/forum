
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Post
 * 
 */
export type Post = $Result.DefaultSelection<Prisma.$PostPayload>
/**
 * Model Topic
 * 
 */
export type Topic = $Result.DefaultSelection<Prisma.$TopicPayload>
/**
 * Model PostImage
 * 
 */
export type PostImage = $Result.DefaultSelection<Prisma.$PostImagePayload>
/**
 * Model Comment
 * 
 */
export type Comment = $Result.DefaultSelection<Prisma.$CommentPayload>
/**
 * Model PostLike
 * 
 */
export type PostLike = $Result.DefaultSelection<Prisma.$PostLikePayload>
/**
 * Model Notification
 * 
 */
export type Notification = $Result.DefaultSelection<Prisma.$NotificationPayload>
/**
 * Model CommentLike
 * 
 */
export type CommentLike = $Result.DefaultSelection<Prisma.$CommentLikePayload>
/**
 * Model Repost
 * 
 */
export type Repost = $Result.DefaultSelection<Prisma.$RepostPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const NotificationType: {
  REPLY_POST: 'REPLY_POST',
  REPLY_COMMENT: 'REPLY_COMMENT',
  LIKE_POST: 'LIKE_POST',
  LIKE_COMMENT: 'LIKE_COMMENT'
};

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

}

export type NotificationType = $Enums.NotificationType

export const NotificationType: typeof $Enums.NotificationType

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  T extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof T ? T['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<T['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<T, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<'extends', Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.post`: Exposes CRUD operations for the **Post** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Posts
    * const posts = await prisma.post.findMany()
    * ```
    */
  get post(): Prisma.PostDelegate<ExtArgs>;

  /**
   * `prisma.topic`: Exposes CRUD operations for the **Topic** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Topics
    * const topics = await prisma.topic.findMany()
    * ```
    */
  get topic(): Prisma.TopicDelegate<ExtArgs>;

  /**
   * `prisma.postImage`: Exposes CRUD operations for the **PostImage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PostImages
    * const postImages = await prisma.postImage.findMany()
    * ```
    */
  get postImage(): Prisma.PostImageDelegate<ExtArgs>;

  /**
   * `prisma.comment`: Exposes CRUD operations for the **Comment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Comments
    * const comments = await prisma.comment.findMany()
    * ```
    */
  get comment(): Prisma.CommentDelegate<ExtArgs>;

  /**
   * `prisma.postLike`: Exposes CRUD operations for the **PostLike** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PostLikes
    * const postLikes = await prisma.postLike.findMany()
    * ```
    */
  get postLike(): Prisma.PostLikeDelegate<ExtArgs>;

  /**
   * `prisma.notification`: Exposes CRUD operations for the **Notification** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Notifications
    * const notifications = await prisma.notification.findMany()
    * ```
    */
  get notification(): Prisma.NotificationDelegate<ExtArgs>;

  /**
   * `prisma.commentLike`: Exposes CRUD operations for the **CommentLike** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CommentLikes
    * const commentLikes = await prisma.commentLike.findMany()
    * ```
    */
  get commentLike(): Prisma.CommentLikeDelegate<ExtArgs>;

  /**
   * `prisma.repost`: Exposes CRUD operations for the **Repost** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Reposts
    * const reposts = await prisma.repost.findMany()
    * ```
    */
  get repost(): Prisma.RepostDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.10.2
   * Query Engine version: 5a9203d0590c951969e85a7d07215503f4672eb9
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches a JSON object.
   * This type can be useful to enforce some input to be JSON-compatible or as a super-type to be extended from. 
   */
  export type JsonObject = {[Key in string]?: JsonValue}

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches a JSON array.
   */
  export interface JsonArray extends Array<JsonValue> {}

  /**
   * From https://github.com/sindresorhus/type-fest/
   * Matches any valid JSON value.
   */
  export type JsonValue = string | number | boolean | JsonObject | JsonArray | null

  /**
   * Matches a JSON object.
   * Unlike `JsonObject`, this type allows undefined and read-only properties.
   */
  export type InputJsonObject = {readonly [Key in string]?: InputJsonValue | null}

  /**
   * Matches a JSON array.
   * Unlike `JsonArray`, readonly arrays are assignable to this type.
   */
  export interface InputJsonArray extends ReadonlyArray<InputJsonValue | null> {}

  /**
   * Matches any valid value that can be used as an input for operations like
   * create and update as the value of a JSON field. Unlike `JsonValue`, this
   * type allows read-only arrays and read-only object properties and disallows
   * `null` at the top level.
   *
   * `null` cannot be used as the value of a JSON field because its meaning
   * would be ambiguous. Use `Prisma.JsonNull` to store the JSON null value or
   * `Prisma.DbNull` to clear the JSON value and set the field to the database
   * NULL value instead.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-by-null-values
   */
  export type InputJsonValue = string | number | boolean | InputJsonObject | InputJsonArray | { toJSON(): unknown }

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Post: 'Post',
    Topic: 'Topic',
    PostImage: 'PostImage',
    Comment: 'Comment',
    PostLike: 'PostLike',
    Notification: 'Notification',
    CommentLike: 'CommentLike',
    Repost: 'Repost'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }


  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs}, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    meta: {
      modelProps: 'user' | 'post' | 'topic' | 'postImage' | 'comment' | 'postLike' | 'notification' | 'commentLike' | 'repost'
      txIsolationLevel: Prisma.TransactionIsolationLevel
    },
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>,
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>,
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Post: {
        payload: Prisma.$PostPayload<ExtArgs>
        fields: Prisma.PostFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PostFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PostFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findFirst: {
            args: Prisma.PostFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PostFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findMany: {
            args: Prisma.PostFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          create: {
            args: Prisma.PostCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          createMany: {
            args: Prisma.PostCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.PostDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          update: {
            args: Prisma.PostUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          deleteMany: {
            args: Prisma.PostDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.PostUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.PostUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          aggregate: {
            args: Prisma.PostAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregatePost>
          }
          groupBy: {
            args: Prisma.PostGroupByArgs<ExtArgs>,
            result: $Utils.Optional<PostGroupByOutputType>[]
          }
          count: {
            args: Prisma.PostCountArgs<ExtArgs>,
            result: $Utils.Optional<PostCountAggregateOutputType> | number
          }
        }
      }
      Topic: {
        payload: Prisma.$TopicPayload<ExtArgs>
        fields: Prisma.TopicFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TopicFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$TopicPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TopicFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          findFirst: {
            args: Prisma.TopicFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$TopicPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TopicFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          findMany: {
            args: Prisma.TopicFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>[]
          }
          create: {
            args: Prisma.TopicCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          createMany: {
            args: Prisma.TopicCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.TopicDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          update: {
            args: Prisma.TopicUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          deleteMany: {
            args: Prisma.TopicDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.TopicUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.TopicUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          aggregate: {
            args: Prisma.TopicAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateTopic>
          }
          groupBy: {
            args: Prisma.TopicGroupByArgs<ExtArgs>,
            result: $Utils.Optional<TopicGroupByOutputType>[]
          }
          count: {
            args: Prisma.TopicCountArgs<ExtArgs>,
            result: $Utils.Optional<TopicCountAggregateOutputType> | number
          }
        }
      }
      PostImage: {
        payload: Prisma.$PostImagePayload<ExtArgs>
        fields: Prisma.PostImageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PostImageFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostImagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PostImageFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostImagePayload>
          }
          findFirst: {
            args: Prisma.PostImageFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostImagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PostImageFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostImagePayload>
          }
          findMany: {
            args: Prisma.PostImageFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostImagePayload>[]
          }
          create: {
            args: Prisma.PostImageCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostImagePayload>
          }
          createMany: {
            args: Prisma.PostImageCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.PostImageDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostImagePayload>
          }
          update: {
            args: Prisma.PostImageUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostImagePayload>
          }
          deleteMany: {
            args: Prisma.PostImageDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.PostImageUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.PostImageUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostImagePayload>
          }
          aggregate: {
            args: Prisma.PostImageAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregatePostImage>
          }
          groupBy: {
            args: Prisma.PostImageGroupByArgs<ExtArgs>,
            result: $Utils.Optional<PostImageGroupByOutputType>[]
          }
          count: {
            args: Prisma.PostImageCountArgs<ExtArgs>,
            result: $Utils.Optional<PostImageCountAggregateOutputType> | number
          }
        }
      }
      Comment: {
        payload: Prisma.$CommentPayload<ExtArgs>
        fields: Prisma.CommentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CommentFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CommentFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          findFirst: {
            args: Prisma.CommentFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CommentFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          findMany: {
            args: Prisma.CommentFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>[]
          }
          create: {
            args: Prisma.CommentCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          createMany: {
            args: Prisma.CommentCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.CommentDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          update: {
            args: Prisma.CommentUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          deleteMany: {
            args: Prisma.CommentDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.CommentUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.CommentUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          aggregate: {
            args: Prisma.CommentAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateComment>
          }
          groupBy: {
            args: Prisma.CommentGroupByArgs<ExtArgs>,
            result: $Utils.Optional<CommentGroupByOutputType>[]
          }
          count: {
            args: Prisma.CommentCountArgs<ExtArgs>,
            result: $Utils.Optional<CommentCountAggregateOutputType> | number
          }
        }
      }
      PostLike: {
        payload: Prisma.$PostLikePayload<ExtArgs>
        fields: Prisma.PostLikeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PostLikeFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostLikePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PostLikeFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostLikePayload>
          }
          findFirst: {
            args: Prisma.PostLikeFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostLikePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PostLikeFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostLikePayload>
          }
          findMany: {
            args: Prisma.PostLikeFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostLikePayload>[]
          }
          create: {
            args: Prisma.PostLikeCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostLikePayload>
          }
          createMany: {
            args: Prisma.PostLikeCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.PostLikeDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostLikePayload>
          }
          update: {
            args: Prisma.PostLikeUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostLikePayload>
          }
          deleteMany: {
            args: Prisma.PostLikeDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.PostLikeUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.PostLikeUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$PostLikePayload>
          }
          aggregate: {
            args: Prisma.PostLikeAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregatePostLike>
          }
          groupBy: {
            args: Prisma.PostLikeGroupByArgs<ExtArgs>,
            result: $Utils.Optional<PostLikeGroupByOutputType>[]
          }
          count: {
            args: Prisma.PostLikeCountArgs<ExtArgs>,
            result: $Utils.Optional<PostLikeCountAggregateOutputType> | number
          }
        }
      }
      Notification: {
        payload: Prisma.$NotificationPayload<ExtArgs>
        fields: Prisma.NotificationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findFirst: {
            args: Prisma.NotificationFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findMany: {
            args: Prisma.NotificationFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          create: {
            args: Prisma.NotificationCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          createMany: {
            args: Prisma.NotificationCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.NotificationDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          update: {
            args: Prisma.NotificationUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          deleteMany: {
            args: Prisma.NotificationDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.NotificationUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          aggregate: {
            args: Prisma.NotificationAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateNotification>
          }
          groupBy: {
            args: Prisma.NotificationGroupByArgs<ExtArgs>,
            result: $Utils.Optional<NotificationGroupByOutputType>[]
          }
          count: {
            args: Prisma.NotificationCountArgs<ExtArgs>,
            result: $Utils.Optional<NotificationCountAggregateOutputType> | number
          }
        }
      }
      CommentLike: {
        payload: Prisma.$CommentLikePayload<ExtArgs>
        fields: Prisma.CommentLikeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CommentLikeFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentLikePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CommentLikeFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentLikePayload>
          }
          findFirst: {
            args: Prisma.CommentLikeFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentLikePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CommentLikeFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentLikePayload>
          }
          findMany: {
            args: Prisma.CommentLikeFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentLikePayload>[]
          }
          create: {
            args: Prisma.CommentLikeCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentLikePayload>
          }
          createMany: {
            args: Prisma.CommentLikeCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.CommentLikeDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentLikePayload>
          }
          update: {
            args: Prisma.CommentLikeUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentLikePayload>
          }
          deleteMany: {
            args: Prisma.CommentLikeDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.CommentLikeUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.CommentLikeUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$CommentLikePayload>
          }
          aggregate: {
            args: Prisma.CommentLikeAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateCommentLike>
          }
          groupBy: {
            args: Prisma.CommentLikeGroupByArgs<ExtArgs>,
            result: $Utils.Optional<CommentLikeGroupByOutputType>[]
          }
          count: {
            args: Prisma.CommentLikeCountArgs<ExtArgs>,
            result: $Utils.Optional<CommentLikeCountAggregateOutputType> | number
          }
        }
      }
      Repost: {
        payload: Prisma.$RepostPayload<ExtArgs>
        fields: Prisma.RepostFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RepostFindUniqueArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$RepostPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RepostFindUniqueOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$RepostPayload>
          }
          findFirst: {
            args: Prisma.RepostFindFirstArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$RepostPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RepostFindFirstOrThrowArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$RepostPayload>
          }
          findMany: {
            args: Prisma.RepostFindManyArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$RepostPayload>[]
          }
          create: {
            args: Prisma.RepostCreateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$RepostPayload>
          }
          createMany: {
            args: Prisma.RepostCreateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          delete: {
            args: Prisma.RepostDeleteArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$RepostPayload>
          }
          update: {
            args: Prisma.RepostUpdateArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$RepostPayload>
          }
          deleteMany: {
            args: Prisma.RepostDeleteManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          updateMany: {
            args: Prisma.RepostUpdateManyArgs<ExtArgs>,
            result: Prisma.BatchPayload
          }
          upsert: {
            args: Prisma.RepostUpsertArgs<ExtArgs>,
            result: $Utils.PayloadToResult<Prisma.$RepostPayload>
          }
          aggregate: {
            args: Prisma.RepostAggregateArgs<ExtArgs>,
            result: $Utils.Optional<AggregateRepost>
          }
          groupBy: {
            args: Prisma.RepostGroupByArgs<ExtArgs>,
            result: $Utils.Optional<RepostGroupByOutputType>[]
          }
          count: {
            args: Prisma.RepostCountArgs<ExtArgs>,
            result: $Utils.Optional<RepostCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<'define', Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    posts: number
    createdTopics: number
    topics: number
    comments: number
    reposts: number
    postLikes: number
    commentLikes: number
    sentNotifications: number
    receivedNotifications: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    posts?: boolean | UserCountOutputTypeCountPostsArgs
    createdTopics?: boolean | UserCountOutputTypeCountCreatedTopicsArgs
    topics?: boolean | UserCountOutputTypeCountTopicsArgs
    comments?: boolean | UserCountOutputTypeCountCommentsArgs
    reposts?: boolean | UserCountOutputTypeCountRepostsArgs
    postLikes?: boolean | UserCountOutputTypeCountPostLikesArgs
    commentLikes?: boolean | UserCountOutputTypeCountCommentLikesArgs
    sentNotifications?: boolean | UserCountOutputTypeCountSentNotificationsArgs
    receivedNotifications?: boolean | UserCountOutputTypeCountReceivedNotificationsArgs
  }

  // Custom InputTypes

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }


  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
  }


  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCreatedTopicsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicWhereInput
  }


  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountTopicsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicWhereInput
  }


  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
  }


  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRepostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RepostWhereInput
  }


  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPostLikesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostLikeWhereInput
  }


  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCommentLikesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentLikeWhereInput
  }


  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSentNotificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
  }


  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountReceivedNotificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
  }



  /**
   * Count Type PostCountOutputType
   */

  export type PostCountOutputType = {
    comments: number
    reposts: number
    likes: number
    images: number
    notifications: number
  }

  export type PostCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comments?: boolean | PostCountOutputTypeCountCommentsArgs
    reposts?: boolean | PostCountOutputTypeCountRepostsArgs
    likes?: boolean | PostCountOutputTypeCountLikesArgs
    images?: boolean | PostCountOutputTypeCountImagesArgs
    notifications?: boolean | PostCountOutputTypeCountNotificationsArgs
  }

  // Custom InputTypes

  /**
   * PostCountOutputType without action
   */
  export type PostCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostCountOutputType
     */
    select?: PostCountOutputTypeSelect<ExtArgs> | null
  }


  /**
   * PostCountOutputType without action
   */
  export type PostCountOutputTypeCountCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
  }


  /**
   * PostCountOutputType without action
   */
  export type PostCountOutputTypeCountRepostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RepostWhereInput
  }


  /**
   * PostCountOutputType without action
   */
  export type PostCountOutputTypeCountLikesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostLikeWhereInput
  }


  /**
   * PostCountOutputType without action
   */
  export type PostCountOutputTypeCountImagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostImageWhereInput
  }


  /**
   * PostCountOutputType without action
   */
  export type PostCountOutputTypeCountNotificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
  }



  /**
   * Count Type TopicCountOutputType
   */

  export type TopicCountOutputType = {
    posts: number
    followers: number
  }

  export type TopicCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    posts?: boolean | TopicCountOutputTypeCountPostsArgs
    followers?: boolean | TopicCountOutputTypeCountFollowersArgs
  }

  // Custom InputTypes

  /**
   * TopicCountOutputType without action
   */
  export type TopicCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicCountOutputType
     */
    select?: TopicCountOutputTypeSelect<ExtArgs> | null
  }


  /**
   * TopicCountOutputType without action
   */
  export type TopicCountOutputTypeCountPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
  }


  /**
   * TopicCountOutputType without action
   */
  export type TopicCountOutputTypeCountFollowersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
  }



  /**
   * Count Type CommentCountOutputType
   */

  export type CommentCountOutputType = {
    replies: number
    likes: number
  }

  export type CommentCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    replies?: boolean | CommentCountOutputTypeCountRepliesArgs
    likes?: boolean | CommentCountOutputTypeCountLikesArgs
  }

  // Custom InputTypes

  /**
   * CommentCountOutputType without action
   */
  export type CommentCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentCountOutputType
     */
    select?: CommentCountOutputTypeSelect<ExtArgs> | null
  }


  /**
   * CommentCountOutputType without action
   */
  export type CommentCountOutputTypeCountRepliesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
  }


  /**
   * CommentCountOutputType without action
   */
  export type CommentCountOutputTypeCountLikesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentLikeWhereInput
  }



  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    password: string | null
    name: string | null
    role: string | null
    banned: boolean | null
    avatar: string | null
    bio: string | null
    postViewMode: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    password: string | null
    name: string | null
    role: string | null
    banned: boolean | null
    avatar: string | null
    bio: string | null
    postViewMode: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    password: number
    name: number
    role: number
    banned: number
    avatar: number
    bio: number
    postViewMode: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    password?: true
    name?: true
    role?: true
    banned?: true
    avatar?: true
    bio?: true
    postViewMode?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    password?: true
    name?: true
    role?: true
    banned?: true
    avatar?: true
    bio?: true
    postViewMode?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    password?: true
    name?: true
    role?: true
    banned?: true
    avatar?: true
    bio?: true
    postViewMode?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    password: string
    name: string | null
    role: string
    banned: boolean
    avatar: string | null
    bio: string | null
    postViewMode: string
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    name?: boolean
    role?: boolean
    banned?: boolean
    avatar?: boolean
    bio?: boolean
    postViewMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    posts?: boolean | User$postsArgs<ExtArgs>
    createdTopics?: boolean | User$createdTopicsArgs<ExtArgs>
    topics?: boolean | User$topicsArgs<ExtArgs>
    comments?: boolean | User$commentsArgs<ExtArgs>
    reposts?: boolean | User$repostsArgs<ExtArgs>
    postLikes?: boolean | User$postLikesArgs<ExtArgs>
    commentLikes?: boolean | User$commentLikesArgs<ExtArgs>
    sentNotifications?: boolean | User$sentNotificationsArgs<ExtArgs>
    receivedNotifications?: boolean | User$receivedNotificationsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    password?: boolean
    name?: boolean
    role?: boolean
    banned?: boolean
    avatar?: boolean
    bio?: boolean
    postViewMode?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    posts?: boolean | User$postsArgs<ExtArgs>
    createdTopics?: boolean | User$createdTopicsArgs<ExtArgs>
    topics?: boolean | User$topicsArgs<ExtArgs>
    comments?: boolean | User$commentsArgs<ExtArgs>
    reposts?: boolean | User$repostsArgs<ExtArgs>
    postLikes?: boolean | User$postLikesArgs<ExtArgs>
    commentLikes?: boolean | User$commentLikesArgs<ExtArgs>
    sentNotifications?: boolean | User$sentNotificationsArgs<ExtArgs>
    receivedNotifications?: boolean | User$receivedNotificationsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }


  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      posts: Prisma.$PostPayload<ExtArgs>[]
      createdTopics: Prisma.$TopicPayload<ExtArgs>[]
      topics: Prisma.$TopicPayload<ExtArgs>[]
      comments: Prisma.$CommentPayload<ExtArgs>[]
      reposts: Prisma.$RepostPayload<ExtArgs>[]
      postLikes: Prisma.$PostLikePayload<ExtArgs>[]
      commentLikes: Prisma.$CommentLikePayload<ExtArgs>[]
      sentNotifications: Prisma.$NotificationPayload<ExtArgs>[]
      receivedNotifications: Prisma.$NotificationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      password: string
      name: string | null
      role: string
      banned: boolean
      avatar: string | null
      bio: string | null
      postViewMode: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }


  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends UserFindUniqueArgs<ExtArgs>>(
      args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>
    ): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findUnique'> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findUniqueOrThrow'>, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends UserFindFirstArgs<ExtArgs>>(
      args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>
    ): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findFirst'> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findFirstOrThrow'>, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends UserFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findMany'>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
    **/
    create<T extends UserCreateArgs<ExtArgs>>(
      args: SelectSubset<T, UserCreateArgs<ExtArgs>>
    ): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'create'>, never, ExtArgs>

    /**
     * Create many Users.
     *     @param {UserCreateManyArgs} args - Arguments to create many Users.
     *     @example
     *     // Create many Users
     *     const user = await prisma.user.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends UserCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
    **/
    delete<T extends UserDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, UserDeleteArgs<ExtArgs>>
    ): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'delete'>, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends UserUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, UserUpdateArgs<ExtArgs>>
    ): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'update'>, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends UserDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends UserUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
    **/
    upsert<T extends UserUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, UserUpsertArgs<ExtArgs>>
    ): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'upsert'>, never, ExtArgs>

    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';

    posts<T extends User$postsArgs<ExtArgs> = {}>(args?: Subset<T, User$postsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findMany'> | Null>;

    createdTopics<T extends User$createdTopicsArgs<ExtArgs> = {}>(args?: Subset<T, User$createdTopicsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'findMany'> | Null>;

    topics<T extends User$topicsArgs<ExtArgs> = {}>(args?: Subset<T, User$topicsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'findMany'> | Null>;

    comments<T extends User$commentsArgs<ExtArgs> = {}>(args?: Subset<T, User$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'findMany'> | Null>;

    reposts<T extends User$repostsArgs<ExtArgs> = {}>(args?: Subset<T, User$repostsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RepostPayload<ExtArgs>, T, 'findMany'> | Null>;

    postLikes<T extends User$postLikesArgs<ExtArgs> = {}>(args?: Subset<T, User$postLikesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, 'findMany'> | Null>;

    commentLikes<T extends User$commentLikesArgs<ExtArgs> = {}>(args?: Subset<T, User$commentLikesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentLikePayload<ExtArgs>, T, 'findMany'> | Null>;

    sentNotifications<T extends User$sentNotificationsArgs<ExtArgs> = {}>(args?: Subset<T, User$sentNotificationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'findMany'> | Null>;

    receivedNotifications<T extends User$receivedNotificationsArgs<ExtArgs> = {}>(args?: Subset<T, User$receivedNotificationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'findMany'> | Null>;

    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }



  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'String'>
    readonly banned: FieldRef<"User", 'Boolean'>
    readonly avatar: FieldRef<"User", 'String'>
    readonly bio: FieldRef<"User", 'String'>
    readonly postViewMode: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes

  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }


  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }


  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }


  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }


  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }


  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }


  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }


  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }


  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }


  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }


  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }


  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }


  /**
   * User.posts
   */
  export type User$postsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    where?: PostWhereInput
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    cursor?: PostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }


  /**
   * User.createdTopics
   */
  export type User$createdTopicsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    where?: TopicWhereInput
    orderBy?: TopicOrderByWithRelationInput | TopicOrderByWithRelationInput[]
    cursor?: TopicWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TopicScalarFieldEnum | TopicScalarFieldEnum[]
  }


  /**
   * User.topics
   */
  export type User$topicsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    where?: TopicWhereInput
    orderBy?: TopicOrderByWithRelationInput | TopicOrderByWithRelationInput[]
    cursor?: TopicWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TopicScalarFieldEnum | TopicScalarFieldEnum[]
  }


  /**
   * User.comments
   */
  export type User$commentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }


  /**
   * User.reposts
   */
  export type User$repostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
    where?: RepostWhereInput
    orderBy?: RepostOrderByWithRelationInput | RepostOrderByWithRelationInput[]
    cursor?: RepostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RepostScalarFieldEnum | RepostScalarFieldEnum[]
  }


  /**
   * User.postLikes
   */
  export type User$postLikesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
    where?: PostLikeWhereInput
    orderBy?: PostLikeOrderByWithRelationInput | PostLikeOrderByWithRelationInput[]
    cursor?: PostLikeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PostLikeScalarFieldEnum | PostLikeScalarFieldEnum[]
  }


  /**
   * User.commentLikes
   */
  export type User$commentLikesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
    where?: CommentLikeWhereInput
    orderBy?: CommentLikeOrderByWithRelationInput | CommentLikeOrderByWithRelationInput[]
    cursor?: CommentLikeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentLikeScalarFieldEnum | CommentLikeScalarFieldEnum[]
  }


  /**
   * User.sentNotifications
   */
  export type User$sentNotificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    cursor?: NotificationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }


  /**
   * User.receivedNotifications
   */
  export type User$receivedNotificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    cursor?: NotificationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }


  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
  }



  /**
   * Model Post
   */

  export type AggregatePost = {
    _count: PostCountAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  export type PostMinAggregateOutputType = {
    id: string | null
    title: string | null
    content: string | null
    authorId: string | null
    topicId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PostMaxAggregateOutputType = {
    id: string | null
    title: string | null
    content: string | null
    authorId: string | null
    topicId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PostCountAggregateOutputType = {
    id: number
    title: number
    content: number
    authorId: number
    topicId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PostMinAggregateInputType = {
    id?: true
    title?: true
    content?: true
    authorId?: true
    topicId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PostMaxAggregateInputType = {
    id?: true
    title?: true
    content?: true
    authorId?: true
    topicId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PostCountAggregateInputType = {
    id?: true
    title?: true
    content?: true
    authorId?: true
    topicId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PostAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Post to aggregate.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Posts
    **/
    _count?: true | PostCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PostMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PostMaxAggregateInputType
  }

  export type GetPostAggregateType<T extends PostAggregateArgs> = {
        [P in keyof T & keyof AggregatePost]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePost[P]>
      : GetScalarType<T[P], AggregatePost[P]>
  }




  export type PostGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
    orderBy?: PostOrderByWithAggregationInput | PostOrderByWithAggregationInput[]
    by: PostScalarFieldEnum[] | PostScalarFieldEnum
    having?: PostScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PostCountAggregateInputType | true
    _min?: PostMinAggregateInputType
    _max?: PostMaxAggregateInputType
  }

  export type PostGroupByOutputType = {
    id: string
    title: string | null
    content: string
    authorId: string
    topicId: string | null
    createdAt: Date
    updatedAt: Date
    _count: PostCountAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  type GetPostGroupByPayload<T extends PostGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PostGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PostGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PostGroupByOutputType[P]>
            : GetScalarType<T[P], PostGroupByOutputType[P]>
        }
      >
    >


  export type PostSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    content?: boolean
    authorId?: boolean
    topicId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    author?: boolean | UserDefaultArgs<ExtArgs>
    comments?: boolean | Post$commentsArgs<ExtArgs>
    reposts?: boolean | Post$repostsArgs<ExtArgs>
    likes?: boolean | Post$likesArgs<ExtArgs>
    images?: boolean | Post$imagesArgs<ExtArgs>
    notifications?: boolean | Post$notificationsArgs<ExtArgs>
    topic?: boolean | Post$topicArgs<ExtArgs>
    _count?: boolean | PostCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["post"]>

  export type PostSelectScalar = {
    id?: boolean
    title?: boolean
    content?: boolean
    authorId?: boolean
    topicId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PostInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    author?: boolean | UserDefaultArgs<ExtArgs>
    comments?: boolean | Post$commentsArgs<ExtArgs>
    reposts?: boolean | Post$repostsArgs<ExtArgs>
    likes?: boolean | Post$likesArgs<ExtArgs>
    images?: boolean | Post$imagesArgs<ExtArgs>
    notifications?: boolean | Post$notificationsArgs<ExtArgs>
    topic?: boolean | Post$topicArgs<ExtArgs>
    _count?: boolean | PostCountOutputTypeDefaultArgs<ExtArgs>
  }


  export type $PostPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Post"
    objects: {
      author: Prisma.$UserPayload<ExtArgs>
      comments: Prisma.$CommentPayload<ExtArgs>[]
      reposts: Prisma.$RepostPayload<ExtArgs>[]
      likes: Prisma.$PostLikePayload<ExtArgs>[]
      images: Prisma.$PostImagePayload<ExtArgs>[]
      notifications: Prisma.$NotificationPayload<ExtArgs>[]
      topic: Prisma.$TopicPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string | null
      content: string
      authorId: string
      topicId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["post"]>
    composites: {}
  }


  type PostGetPayload<S extends boolean | null | undefined | PostDefaultArgs> = $Result.GetResult<Prisma.$PostPayload, S>

  type PostCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PostFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PostCountAggregateInputType | true
    }

  export interface PostDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Post'], meta: { name: 'Post' } }
    /**
     * Find zero or one Post that matches the filter.
     * @param {PostFindUniqueArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends PostFindUniqueArgs<ExtArgs>>(
      args: SelectSubset<T, PostFindUniqueArgs<ExtArgs>>
    ): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findUnique'> | null, null, ExtArgs>

    /**
     * Find one Post that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {PostFindUniqueOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends PostFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, PostFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findUniqueOrThrow'>, never, ExtArgs>

    /**
     * Find the first Post that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends PostFindFirstArgs<ExtArgs>>(
      args?: SelectSubset<T, PostFindFirstArgs<ExtArgs>>
    ): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findFirst'> | null, null, ExtArgs>

    /**
     * Find the first Post that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends PostFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, PostFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findFirstOrThrow'>, never, ExtArgs>

    /**
     * Find zero or more Posts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Posts
     * const posts = await prisma.post.findMany()
     * 
     * // Get first 10 Posts
     * const posts = await prisma.post.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const postWithIdOnly = await prisma.post.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends PostFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, PostFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findMany'>>

    /**
     * Create a Post.
     * @param {PostCreateArgs} args - Arguments to create a Post.
     * @example
     * // Create one Post
     * const Post = await prisma.post.create({
     *   data: {
     *     // ... data to create a Post
     *   }
     * })
     * 
    **/
    create<T extends PostCreateArgs<ExtArgs>>(
      args: SelectSubset<T, PostCreateArgs<ExtArgs>>
    ): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'create'>, never, ExtArgs>

    /**
     * Create many Posts.
     *     @param {PostCreateManyArgs} args - Arguments to create many Posts.
     *     @example
     *     // Create many Posts
     *     const post = await prisma.post.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends PostCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, PostCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Post.
     * @param {PostDeleteArgs} args - Arguments to delete one Post.
     * @example
     * // Delete one Post
     * const Post = await prisma.post.delete({
     *   where: {
     *     // ... filter to delete one Post
     *   }
     * })
     * 
    **/
    delete<T extends PostDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, PostDeleteArgs<ExtArgs>>
    ): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'delete'>, never, ExtArgs>

    /**
     * Update one Post.
     * @param {PostUpdateArgs} args - Arguments to update one Post.
     * @example
     * // Update one Post
     * const post = await prisma.post.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends PostUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, PostUpdateArgs<ExtArgs>>
    ): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'update'>, never, ExtArgs>

    /**
     * Delete zero or more Posts.
     * @param {PostDeleteManyArgs} args - Arguments to filter Posts to delete.
     * @example
     * // Delete a few Posts
     * const { count } = await prisma.post.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends PostDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, PostDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends PostUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, PostUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Post.
     * @param {PostUpsertArgs} args - Arguments to update or create a Post.
     * @example
     * // Update or create a Post
     * const post = await prisma.post.upsert({
     *   create: {
     *     // ... data to create a Post
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Post we want to update
     *   }
     * })
    **/
    upsert<T extends PostUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, PostUpsertArgs<ExtArgs>>
    ): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'upsert'>, never, ExtArgs>

    /**
     * Count the number of Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostCountArgs} args - Arguments to filter Posts to count.
     * @example
     * // Count the number of Posts
     * const count = await prisma.post.count({
     *   where: {
     *     // ... the filter for the Posts we want to count
     *   }
     * })
    **/
    count<T extends PostCountArgs>(
      args?: Subset<T, PostCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PostCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PostAggregateArgs>(args: Subset<T, PostAggregateArgs>): Prisma.PrismaPromise<GetPostAggregateType<T>>

    /**
     * Group by Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PostGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PostGroupByArgs['orderBy'] }
        : { orderBy?: PostGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Post model
   */
  readonly fields: PostFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Post.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PostClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';

    author<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    comments<T extends Post$commentsArgs<ExtArgs> = {}>(args?: Subset<T, Post$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'findMany'> | Null>;

    reposts<T extends Post$repostsArgs<ExtArgs> = {}>(args?: Subset<T, Post$repostsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RepostPayload<ExtArgs>, T, 'findMany'> | Null>;

    likes<T extends Post$likesArgs<ExtArgs> = {}>(args?: Subset<T, Post$likesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, 'findMany'> | Null>;

    images<T extends Post$imagesArgs<ExtArgs> = {}>(args?: Subset<T, Post$imagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostImagePayload<ExtArgs>, T, 'findMany'> | Null>;

    notifications<T extends Post$notificationsArgs<ExtArgs> = {}>(args?: Subset<T, Post$notificationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'findMany'> | Null>;

    topic<T extends Post$topicArgs<ExtArgs> = {}>(args?: Subset<T, Post$topicArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'findUniqueOrThrow'> | null, null, ExtArgs>;

    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }



  /**
   * Fields of the Post model
   */ 
  interface PostFieldRefs {
    readonly id: FieldRef<"Post", 'String'>
    readonly title: FieldRef<"Post", 'String'>
    readonly content: FieldRef<"Post", 'String'>
    readonly authorId: FieldRef<"Post", 'String'>
    readonly topicId: FieldRef<"Post", 'String'>
    readonly createdAt: FieldRef<"Post", 'DateTime'>
    readonly updatedAt: FieldRef<"Post", 'DateTime'>
  }
    

  // Custom InputTypes

  /**
   * Post findUnique
   */
  export type PostFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }


  /**
   * Post findUniqueOrThrow
   */
  export type PostFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }


  /**
   * Post findFirst
   */
  export type PostFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }


  /**
   * Post findFirstOrThrow
   */
  export type PostFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }


  /**
   * Post findMany
   */
  export type PostFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Posts to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }


  /**
   * Post create
   */
  export type PostCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The data needed to create a Post.
     */
    data: XOR<PostCreateInput, PostUncheckedCreateInput>
  }


  /**
   * Post createMany
   */
  export type PostCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
    skipDuplicates?: boolean
  }


  /**
   * Post update
   */
  export type PostUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The data needed to update a Post.
     */
    data: XOR<PostUpdateInput, PostUncheckedUpdateInput>
    /**
     * Choose, which Post to update.
     */
    where: PostWhereUniqueInput
  }


  /**
   * Post updateMany
   */
  export type PostUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
  }


  /**
   * Post upsert
   */
  export type PostUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The filter to search for the Post to update in case it exists.
     */
    where: PostWhereUniqueInput
    /**
     * In case the Post found by the `where` argument doesn't exist, create a new Post with this data.
     */
    create: XOR<PostCreateInput, PostUncheckedCreateInput>
    /**
     * In case the Post was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PostUpdateInput, PostUncheckedUpdateInput>
  }


  /**
   * Post delete
   */
  export type PostDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter which Post to delete.
     */
    where: PostWhereUniqueInput
  }


  /**
   * Post deleteMany
   */
  export type PostDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Posts to delete
     */
    where?: PostWhereInput
  }


  /**
   * Post.comments
   */
  export type Post$commentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }


  /**
   * Post.reposts
   */
  export type Post$repostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
    where?: RepostWhereInput
    orderBy?: RepostOrderByWithRelationInput | RepostOrderByWithRelationInput[]
    cursor?: RepostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RepostScalarFieldEnum | RepostScalarFieldEnum[]
  }


  /**
   * Post.likes
   */
  export type Post$likesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
    where?: PostLikeWhereInput
    orderBy?: PostLikeOrderByWithRelationInput | PostLikeOrderByWithRelationInput[]
    cursor?: PostLikeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PostLikeScalarFieldEnum | PostLikeScalarFieldEnum[]
  }


  /**
   * Post.images
   */
  export type Post$imagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostImage
     */
    select?: PostImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostImageInclude<ExtArgs> | null
    where?: PostImageWhereInput
    orderBy?: PostImageOrderByWithRelationInput | PostImageOrderByWithRelationInput[]
    cursor?: PostImageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PostImageScalarFieldEnum | PostImageScalarFieldEnum[]
  }


  /**
   * Post.notifications
   */
  export type Post$notificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    cursor?: NotificationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }


  /**
   * Post.topic
   */
  export type Post$topicArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    where?: TopicWhereInput
  }


  /**
   * Post without action
   */
  export type PostDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
  }



  /**
   * Model Topic
   */

  export type AggregateTopic = {
    _count: TopicCountAggregateOutputType | null
    _min: TopicMinAggregateOutputType | null
    _max: TopicMaxAggregateOutputType | null
  }

  export type TopicMinAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    icon: string | null
    creatorId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TopicMaxAggregateOutputType = {
    id: string | null
    name: string | null
    description: string | null
    icon: string | null
    creatorId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TopicCountAggregateOutputType = {
    id: number
    name: number
    description: number
    icon: number
    creatorId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TopicMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    icon?: true
    creatorId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TopicMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    icon?: true
    creatorId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TopicCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    icon?: true
    creatorId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TopicAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Topic to aggregate.
     */
    where?: TopicWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Topics to fetch.
     */
    orderBy?: TopicOrderByWithRelationInput | TopicOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TopicWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Topics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Topics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Topics
    **/
    _count?: true | TopicCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TopicMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TopicMaxAggregateInputType
  }

  export type GetTopicAggregateType<T extends TopicAggregateArgs> = {
        [P in keyof T & keyof AggregateTopic]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTopic[P]>
      : GetScalarType<T[P], AggregateTopic[P]>
  }




  export type TopicGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicWhereInput
    orderBy?: TopicOrderByWithAggregationInput | TopicOrderByWithAggregationInput[]
    by: TopicScalarFieldEnum[] | TopicScalarFieldEnum
    having?: TopicScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TopicCountAggregateInputType | true
    _min?: TopicMinAggregateInputType
    _max?: TopicMaxAggregateInputType
  }

  export type TopicGroupByOutputType = {
    id: string
    name: string
    description: string | null
    icon: string | null
    creatorId: string | null
    createdAt: Date
    updatedAt: Date
    _count: TopicCountAggregateOutputType | null
    _min: TopicMinAggregateOutputType | null
    _max: TopicMaxAggregateOutputType | null
  }

  type GetTopicGroupByPayload<T extends TopicGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TopicGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TopicGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TopicGroupByOutputType[P]>
            : GetScalarType<T[P], TopicGroupByOutputType[P]>
        }
      >
    >


  export type TopicSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    icon?: boolean
    creatorId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    posts?: boolean | Topic$postsArgs<ExtArgs>
    creator?: boolean | Topic$creatorArgs<ExtArgs>
    followers?: boolean | Topic$followersArgs<ExtArgs>
    _count?: boolean | TopicCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["topic"]>

  export type TopicSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    icon?: boolean
    creatorId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TopicInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    posts?: boolean | Topic$postsArgs<ExtArgs>
    creator?: boolean | Topic$creatorArgs<ExtArgs>
    followers?: boolean | Topic$followersArgs<ExtArgs>
    _count?: boolean | TopicCountOutputTypeDefaultArgs<ExtArgs>
  }


  export type $TopicPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Topic"
    objects: {
      posts: Prisma.$PostPayload<ExtArgs>[]
      creator: Prisma.$UserPayload<ExtArgs> | null
      followers: Prisma.$UserPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      description: string | null
      icon: string | null
      creatorId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["topic"]>
    composites: {}
  }


  type TopicGetPayload<S extends boolean | null | undefined | TopicDefaultArgs> = $Result.GetResult<Prisma.$TopicPayload, S>

  type TopicCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TopicFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TopicCountAggregateInputType | true
    }

  export interface TopicDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Topic'], meta: { name: 'Topic' } }
    /**
     * Find zero or one Topic that matches the filter.
     * @param {TopicFindUniqueArgs} args - Arguments to find a Topic
     * @example
     * // Get one Topic
     * const topic = await prisma.topic.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends TopicFindUniqueArgs<ExtArgs>>(
      args: SelectSubset<T, TopicFindUniqueArgs<ExtArgs>>
    ): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'findUnique'> | null, null, ExtArgs>

    /**
     * Find one Topic that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {TopicFindUniqueOrThrowArgs} args - Arguments to find a Topic
     * @example
     * // Get one Topic
     * const topic = await prisma.topic.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends TopicFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, TopicFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'findUniqueOrThrow'>, never, ExtArgs>

    /**
     * Find the first Topic that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicFindFirstArgs} args - Arguments to find a Topic
     * @example
     * // Get one Topic
     * const topic = await prisma.topic.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends TopicFindFirstArgs<ExtArgs>>(
      args?: SelectSubset<T, TopicFindFirstArgs<ExtArgs>>
    ): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'findFirst'> | null, null, ExtArgs>

    /**
     * Find the first Topic that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicFindFirstOrThrowArgs} args - Arguments to find a Topic
     * @example
     * // Get one Topic
     * const topic = await prisma.topic.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends TopicFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, TopicFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'findFirstOrThrow'>, never, ExtArgs>

    /**
     * Find zero or more Topics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Topics
     * const topics = await prisma.topic.findMany()
     * 
     * // Get first 10 Topics
     * const topics = await prisma.topic.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const topicWithIdOnly = await prisma.topic.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends TopicFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, TopicFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'findMany'>>

    /**
     * Create a Topic.
     * @param {TopicCreateArgs} args - Arguments to create a Topic.
     * @example
     * // Create one Topic
     * const Topic = await prisma.topic.create({
     *   data: {
     *     // ... data to create a Topic
     *   }
     * })
     * 
    **/
    create<T extends TopicCreateArgs<ExtArgs>>(
      args: SelectSubset<T, TopicCreateArgs<ExtArgs>>
    ): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'create'>, never, ExtArgs>

    /**
     * Create many Topics.
     *     @param {TopicCreateManyArgs} args - Arguments to create many Topics.
     *     @example
     *     // Create many Topics
     *     const topic = await prisma.topic.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends TopicCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, TopicCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Topic.
     * @param {TopicDeleteArgs} args - Arguments to delete one Topic.
     * @example
     * // Delete one Topic
     * const Topic = await prisma.topic.delete({
     *   where: {
     *     // ... filter to delete one Topic
     *   }
     * })
     * 
    **/
    delete<T extends TopicDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, TopicDeleteArgs<ExtArgs>>
    ): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'delete'>, never, ExtArgs>

    /**
     * Update one Topic.
     * @param {TopicUpdateArgs} args - Arguments to update one Topic.
     * @example
     * // Update one Topic
     * const topic = await prisma.topic.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends TopicUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, TopicUpdateArgs<ExtArgs>>
    ): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'update'>, never, ExtArgs>

    /**
     * Delete zero or more Topics.
     * @param {TopicDeleteManyArgs} args - Arguments to filter Topics to delete.
     * @example
     * // Delete a few Topics
     * const { count } = await prisma.topic.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends TopicDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, TopicDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Topics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Topics
     * const topic = await prisma.topic.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends TopicUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, TopicUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Topic.
     * @param {TopicUpsertArgs} args - Arguments to update or create a Topic.
     * @example
     * // Update or create a Topic
     * const topic = await prisma.topic.upsert({
     *   create: {
     *     // ... data to create a Topic
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Topic we want to update
     *   }
     * })
    **/
    upsert<T extends TopicUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, TopicUpsertArgs<ExtArgs>>
    ): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, 'upsert'>, never, ExtArgs>

    /**
     * Count the number of Topics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicCountArgs} args - Arguments to filter Topics to count.
     * @example
     * // Count the number of Topics
     * const count = await prisma.topic.count({
     *   where: {
     *     // ... the filter for the Topics we want to count
     *   }
     * })
    **/
    count<T extends TopicCountArgs>(
      args?: Subset<T, TopicCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TopicCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Topic.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TopicAggregateArgs>(args: Subset<T, TopicAggregateArgs>): Prisma.PrismaPromise<GetTopicAggregateType<T>>

    /**
     * Group by Topic.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TopicGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TopicGroupByArgs['orderBy'] }
        : { orderBy?: TopicGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TopicGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTopicGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Topic model
   */
  readonly fields: TopicFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Topic.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TopicClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';

    posts<T extends Topic$postsArgs<ExtArgs> = {}>(args?: Subset<T, Topic$postsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findMany'> | Null>;

    creator<T extends Topic$creatorArgs<ExtArgs> = {}>(args?: Subset<T, Topic$creatorArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findUniqueOrThrow'> | null, null, ExtArgs>;

    followers<T extends Topic$followersArgs<ExtArgs> = {}>(args?: Subset<T, Topic$followersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findMany'> | Null>;

    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }



  /**
   * Fields of the Topic model
   */ 
  interface TopicFieldRefs {
    readonly id: FieldRef<"Topic", 'String'>
    readonly name: FieldRef<"Topic", 'String'>
    readonly description: FieldRef<"Topic", 'String'>
    readonly icon: FieldRef<"Topic", 'String'>
    readonly creatorId: FieldRef<"Topic", 'String'>
    readonly createdAt: FieldRef<"Topic", 'DateTime'>
    readonly updatedAt: FieldRef<"Topic", 'DateTime'>
  }
    

  // Custom InputTypes

  /**
   * Topic findUnique
   */
  export type TopicFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter, which Topic to fetch.
     */
    where: TopicWhereUniqueInput
  }


  /**
   * Topic findUniqueOrThrow
   */
  export type TopicFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter, which Topic to fetch.
     */
    where: TopicWhereUniqueInput
  }


  /**
   * Topic findFirst
   */
  export type TopicFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter, which Topic to fetch.
     */
    where?: TopicWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Topics to fetch.
     */
    orderBy?: TopicOrderByWithRelationInput | TopicOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Topics.
     */
    cursor?: TopicWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Topics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Topics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Topics.
     */
    distinct?: TopicScalarFieldEnum | TopicScalarFieldEnum[]
  }


  /**
   * Topic findFirstOrThrow
   */
  export type TopicFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter, which Topic to fetch.
     */
    where?: TopicWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Topics to fetch.
     */
    orderBy?: TopicOrderByWithRelationInput | TopicOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Topics.
     */
    cursor?: TopicWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Topics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Topics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Topics.
     */
    distinct?: TopicScalarFieldEnum | TopicScalarFieldEnum[]
  }


  /**
   * Topic findMany
   */
  export type TopicFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter, which Topics to fetch.
     */
    where?: TopicWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Topics to fetch.
     */
    orderBy?: TopicOrderByWithRelationInput | TopicOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Topics.
     */
    cursor?: TopicWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Topics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Topics.
     */
    skip?: number
    distinct?: TopicScalarFieldEnum | TopicScalarFieldEnum[]
  }


  /**
   * Topic create
   */
  export type TopicCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * The data needed to create a Topic.
     */
    data: XOR<TopicCreateInput, TopicUncheckedCreateInput>
  }


  /**
   * Topic createMany
   */
  export type TopicCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Topics.
     */
    data: TopicCreateManyInput | TopicCreateManyInput[]
    skipDuplicates?: boolean
  }


  /**
   * Topic update
   */
  export type TopicUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * The data needed to update a Topic.
     */
    data: XOR<TopicUpdateInput, TopicUncheckedUpdateInput>
    /**
     * Choose, which Topic to update.
     */
    where: TopicWhereUniqueInput
  }


  /**
   * Topic updateMany
   */
  export type TopicUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Topics.
     */
    data: XOR<TopicUpdateManyMutationInput, TopicUncheckedUpdateManyInput>
    /**
     * Filter which Topics to update
     */
    where?: TopicWhereInput
  }


  /**
   * Topic upsert
   */
  export type TopicUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * The filter to search for the Topic to update in case it exists.
     */
    where: TopicWhereUniqueInput
    /**
     * In case the Topic found by the `where` argument doesn't exist, create a new Topic with this data.
     */
    create: XOR<TopicCreateInput, TopicUncheckedCreateInput>
    /**
     * In case the Topic was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TopicUpdateInput, TopicUncheckedUpdateInput>
  }


  /**
   * Topic delete
   */
  export type TopicDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter which Topic to delete.
     */
    where: TopicWhereUniqueInput
  }


  /**
   * Topic deleteMany
   */
  export type TopicDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Topics to delete
     */
    where?: TopicWhereInput
  }


  /**
   * Topic.posts
   */
  export type Topic$postsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    where?: PostWhereInput
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    cursor?: PostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }


  /**
   * Topic.creator
   */
  export type Topic$creatorArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }


  /**
   * Topic.followers
   */
  export type Topic$followersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    cursor?: UserWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }


  /**
   * Topic without action
   */
  export type TopicDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: TopicInclude<ExtArgs> | null
  }



  /**
   * Model PostImage
   */

  export type AggregatePostImage = {
    _count: PostImageCountAggregateOutputType | null
    _min: PostImageMinAggregateOutputType | null
    _max: PostImageMaxAggregateOutputType | null
  }

  export type PostImageMinAggregateOutputType = {
    id: string | null
    url: string | null
    postId: string | null
    createdAt: Date | null
  }

  export type PostImageMaxAggregateOutputType = {
    id: string | null
    url: string | null
    postId: string | null
    createdAt: Date | null
  }

  export type PostImageCountAggregateOutputType = {
    id: number
    url: number
    postId: number
    createdAt: number
    _all: number
  }


  export type PostImageMinAggregateInputType = {
    id?: true
    url?: true
    postId?: true
    createdAt?: true
  }

  export type PostImageMaxAggregateInputType = {
    id?: true
    url?: true
    postId?: true
    createdAt?: true
  }

  export type PostImageCountAggregateInputType = {
    id?: true
    url?: true
    postId?: true
    createdAt?: true
    _all?: true
  }

  export type PostImageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PostImage to aggregate.
     */
    where?: PostImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostImages to fetch.
     */
    orderBy?: PostImageOrderByWithRelationInput | PostImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PostImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PostImages
    **/
    _count?: true | PostImageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PostImageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PostImageMaxAggregateInputType
  }

  export type GetPostImageAggregateType<T extends PostImageAggregateArgs> = {
        [P in keyof T & keyof AggregatePostImage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePostImage[P]>
      : GetScalarType<T[P], AggregatePostImage[P]>
  }




  export type PostImageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostImageWhereInput
    orderBy?: PostImageOrderByWithAggregationInput | PostImageOrderByWithAggregationInput[]
    by: PostImageScalarFieldEnum[] | PostImageScalarFieldEnum
    having?: PostImageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PostImageCountAggregateInputType | true
    _min?: PostImageMinAggregateInputType
    _max?: PostImageMaxAggregateInputType
  }

  export type PostImageGroupByOutputType = {
    id: string
    url: string
    postId: string
    createdAt: Date
    _count: PostImageCountAggregateOutputType | null
    _min: PostImageMinAggregateOutputType | null
    _max: PostImageMaxAggregateOutputType | null
  }

  type GetPostImageGroupByPayload<T extends PostImageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PostImageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PostImageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PostImageGroupByOutputType[P]>
            : GetScalarType<T[P], PostImageGroupByOutputType[P]>
        }
      >
    >


  export type PostImageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    url?: boolean
    postId?: boolean
    createdAt?: boolean
    post?: boolean | PostDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["postImage"]>

  export type PostImageSelectScalar = {
    id?: boolean
    url?: boolean
    postId?: boolean
    createdAt?: boolean
  }

  export type PostImageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    post?: boolean | PostDefaultArgs<ExtArgs>
  }


  export type $PostImagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PostImage"
    objects: {
      post: Prisma.$PostPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      url: string
      postId: string
      createdAt: Date
    }, ExtArgs["result"]["postImage"]>
    composites: {}
  }


  type PostImageGetPayload<S extends boolean | null | undefined | PostImageDefaultArgs> = $Result.GetResult<Prisma.$PostImagePayload, S>

  type PostImageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PostImageFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PostImageCountAggregateInputType | true
    }

  export interface PostImageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PostImage'], meta: { name: 'PostImage' } }
    /**
     * Find zero or one PostImage that matches the filter.
     * @param {PostImageFindUniqueArgs} args - Arguments to find a PostImage
     * @example
     * // Get one PostImage
     * const postImage = await prisma.postImage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends PostImageFindUniqueArgs<ExtArgs>>(
      args: SelectSubset<T, PostImageFindUniqueArgs<ExtArgs>>
    ): Prisma__PostImageClient<$Result.GetResult<Prisma.$PostImagePayload<ExtArgs>, T, 'findUnique'> | null, null, ExtArgs>

    /**
     * Find one PostImage that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {PostImageFindUniqueOrThrowArgs} args - Arguments to find a PostImage
     * @example
     * // Get one PostImage
     * const postImage = await prisma.postImage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends PostImageFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, PostImageFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__PostImageClient<$Result.GetResult<Prisma.$PostImagePayload<ExtArgs>, T, 'findUniqueOrThrow'>, never, ExtArgs>

    /**
     * Find the first PostImage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostImageFindFirstArgs} args - Arguments to find a PostImage
     * @example
     * // Get one PostImage
     * const postImage = await prisma.postImage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends PostImageFindFirstArgs<ExtArgs>>(
      args?: SelectSubset<T, PostImageFindFirstArgs<ExtArgs>>
    ): Prisma__PostImageClient<$Result.GetResult<Prisma.$PostImagePayload<ExtArgs>, T, 'findFirst'> | null, null, ExtArgs>

    /**
     * Find the first PostImage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostImageFindFirstOrThrowArgs} args - Arguments to find a PostImage
     * @example
     * // Get one PostImage
     * const postImage = await prisma.postImage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends PostImageFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, PostImageFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__PostImageClient<$Result.GetResult<Prisma.$PostImagePayload<ExtArgs>, T, 'findFirstOrThrow'>, never, ExtArgs>

    /**
     * Find zero or more PostImages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostImageFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PostImages
     * const postImages = await prisma.postImage.findMany()
     * 
     * // Get first 10 PostImages
     * const postImages = await prisma.postImage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const postImageWithIdOnly = await prisma.postImage.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends PostImageFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, PostImageFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostImagePayload<ExtArgs>, T, 'findMany'>>

    /**
     * Create a PostImage.
     * @param {PostImageCreateArgs} args - Arguments to create a PostImage.
     * @example
     * // Create one PostImage
     * const PostImage = await prisma.postImage.create({
     *   data: {
     *     // ... data to create a PostImage
     *   }
     * })
     * 
    **/
    create<T extends PostImageCreateArgs<ExtArgs>>(
      args: SelectSubset<T, PostImageCreateArgs<ExtArgs>>
    ): Prisma__PostImageClient<$Result.GetResult<Prisma.$PostImagePayload<ExtArgs>, T, 'create'>, never, ExtArgs>

    /**
     * Create many PostImages.
     *     @param {PostImageCreateManyArgs} args - Arguments to create many PostImages.
     *     @example
     *     // Create many PostImages
     *     const postImage = await prisma.postImage.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends PostImageCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, PostImageCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a PostImage.
     * @param {PostImageDeleteArgs} args - Arguments to delete one PostImage.
     * @example
     * // Delete one PostImage
     * const PostImage = await prisma.postImage.delete({
     *   where: {
     *     // ... filter to delete one PostImage
     *   }
     * })
     * 
    **/
    delete<T extends PostImageDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, PostImageDeleteArgs<ExtArgs>>
    ): Prisma__PostImageClient<$Result.GetResult<Prisma.$PostImagePayload<ExtArgs>, T, 'delete'>, never, ExtArgs>

    /**
     * Update one PostImage.
     * @param {PostImageUpdateArgs} args - Arguments to update one PostImage.
     * @example
     * // Update one PostImage
     * const postImage = await prisma.postImage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends PostImageUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, PostImageUpdateArgs<ExtArgs>>
    ): Prisma__PostImageClient<$Result.GetResult<Prisma.$PostImagePayload<ExtArgs>, T, 'update'>, never, ExtArgs>

    /**
     * Delete zero or more PostImages.
     * @param {PostImageDeleteManyArgs} args - Arguments to filter PostImages to delete.
     * @example
     * // Delete a few PostImages
     * const { count } = await prisma.postImage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends PostImageDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, PostImageDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PostImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostImageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PostImages
     * const postImage = await prisma.postImage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends PostImageUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, PostImageUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PostImage.
     * @param {PostImageUpsertArgs} args - Arguments to update or create a PostImage.
     * @example
     * // Update or create a PostImage
     * const postImage = await prisma.postImage.upsert({
     *   create: {
     *     // ... data to create a PostImage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PostImage we want to update
     *   }
     * })
    **/
    upsert<T extends PostImageUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, PostImageUpsertArgs<ExtArgs>>
    ): Prisma__PostImageClient<$Result.GetResult<Prisma.$PostImagePayload<ExtArgs>, T, 'upsert'>, never, ExtArgs>

    /**
     * Count the number of PostImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostImageCountArgs} args - Arguments to filter PostImages to count.
     * @example
     * // Count the number of PostImages
     * const count = await prisma.postImage.count({
     *   where: {
     *     // ... the filter for the PostImages we want to count
     *   }
     * })
    **/
    count<T extends PostImageCountArgs>(
      args?: Subset<T, PostImageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PostImageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PostImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostImageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PostImageAggregateArgs>(args: Subset<T, PostImageAggregateArgs>): Prisma.PrismaPromise<GetPostImageAggregateType<T>>

    /**
     * Group by PostImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostImageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PostImageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PostImageGroupByArgs['orderBy'] }
        : { orderBy?: PostImageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PostImageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostImageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PostImage model
   */
  readonly fields: PostImageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PostImage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PostImageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';

    post<T extends PostDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PostDefaultArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }



  /**
   * Fields of the PostImage model
   */ 
  interface PostImageFieldRefs {
    readonly id: FieldRef<"PostImage", 'String'>
    readonly url: FieldRef<"PostImage", 'String'>
    readonly postId: FieldRef<"PostImage", 'String'>
    readonly createdAt: FieldRef<"PostImage", 'DateTime'>
  }
    

  // Custom InputTypes

  /**
   * PostImage findUnique
   */
  export type PostImageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostImage
     */
    select?: PostImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostImageInclude<ExtArgs> | null
    /**
     * Filter, which PostImage to fetch.
     */
    where: PostImageWhereUniqueInput
  }


  /**
   * PostImage findUniqueOrThrow
   */
  export type PostImageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostImage
     */
    select?: PostImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostImageInclude<ExtArgs> | null
    /**
     * Filter, which PostImage to fetch.
     */
    where: PostImageWhereUniqueInput
  }


  /**
   * PostImage findFirst
   */
  export type PostImageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostImage
     */
    select?: PostImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostImageInclude<ExtArgs> | null
    /**
     * Filter, which PostImage to fetch.
     */
    where?: PostImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostImages to fetch.
     */
    orderBy?: PostImageOrderByWithRelationInput | PostImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PostImages.
     */
    cursor?: PostImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PostImages.
     */
    distinct?: PostImageScalarFieldEnum | PostImageScalarFieldEnum[]
  }


  /**
   * PostImage findFirstOrThrow
   */
  export type PostImageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostImage
     */
    select?: PostImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostImageInclude<ExtArgs> | null
    /**
     * Filter, which PostImage to fetch.
     */
    where?: PostImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostImages to fetch.
     */
    orderBy?: PostImageOrderByWithRelationInput | PostImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PostImages.
     */
    cursor?: PostImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PostImages.
     */
    distinct?: PostImageScalarFieldEnum | PostImageScalarFieldEnum[]
  }


  /**
   * PostImage findMany
   */
  export type PostImageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostImage
     */
    select?: PostImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostImageInclude<ExtArgs> | null
    /**
     * Filter, which PostImages to fetch.
     */
    where?: PostImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostImages to fetch.
     */
    orderBy?: PostImageOrderByWithRelationInput | PostImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PostImages.
     */
    cursor?: PostImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostImages.
     */
    skip?: number
    distinct?: PostImageScalarFieldEnum | PostImageScalarFieldEnum[]
  }


  /**
   * PostImage create
   */
  export type PostImageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostImage
     */
    select?: PostImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostImageInclude<ExtArgs> | null
    /**
     * The data needed to create a PostImage.
     */
    data: XOR<PostImageCreateInput, PostImageUncheckedCreateInput>
  }


  /**
   * PostImage createMany
   */
  export type PostImageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PostImages.
     */
    data: PostImageCreateManyInput | PostImageCreateManyInput[]
    skipDuplicates?: boolean
  }


  /**
   * PostImage update
   */
  export type PostImageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostImage
     */
    select?: PostImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostImageInclude<ExtArgs> | null
    /**
     * The data needed to update a PostImage.
     */
    data: XOR<PostImageUpdateInput, PostImageUncheckedUpdateInput>
    /**
     * Choose, which PostImage to update.
     */
    where: PostImageWhereUniqueInput
  }


  /**
   * PostImage updateMany
   */
  export type PostImageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PostImages.
     */
    data: XOR<PostImageUpdateManyMutationInput, PostImageUncheckedUpdateManyInput>
    /**
     * Filter which PostImages to update
     */
    where?: PostImageWhereInput
  }


  /**
   * PostImage upsert
   */
  export type PostImageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostImage
     */
    select?: PostImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostImageInclude<ExtArgs> | null
    /**
     * The filter to search for the PostImage to update in case it exists.
     */
    where: PostImageWhereUniqueInput
    /**
     * In case the PostImage found by the `where` argument doesn't exist, create a new PostImage with this data.
     */
    create: XOR<PostImageCreateInput, PostImageUncheckedCreateInput>
    /**
     * In case the PostImage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PostImageUpdateInput, PostImageUncheckedUpdateInput>
  }


  /**
   * PostImage delete
   */
  export type PostImageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostImage
     */
    select?: PostImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostImageInclude<ExtArgs> | null
    /**
     * Filter which PostImage to delete.
     */
    where: PostImageWhereUniqueInput
  }


  /**
   * PostImage deleteMany
   */
  export type PostImageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PostImages to delete
     */
    where?: PostImageWhereInput
  }


  /**
   * PostImage without action
   */
  export type PostImageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostImage
     */
    select?: PostImageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostImageInclude<ExtArgs> | null
  }



  /**
   * Model Comment
   */

  export type AggregateComment = {
    _count: CommentCountAggregateOutputType | null
    _min: CommentMinAggregateOutputType | null
    _max: CommentMaxAggregateOutputType | null
  }

  export type CommentMinAggregateOutputType = {
    id: string | null
    content: string | null
    postId: string | null
    authorId: string | null
    parentId: string | null
    createdAt: Date | null
  }

  export type CommentMaxAggregateOutputType = {
    id: string | null
    content: string | null
    postId: string | null
    authorId: string | null
    parentId: string | null
    createdAt: Date | null
  }

  export type CommentCountAggregateOutputType = {
    id: number
    content: number
    postId: number
    authorId: number
    parentId: number
    createdAt: number
    _all: number
  }


  export type CommentMinAggregateInputType = {
    id?: true
    content?: true
    postId?: true
    authorId?: true
    parentId?: true
    createdAt?: true
  }

  export type CommentMaxAggregateInputType = {
    id?: true
    content?: true
    postId?: true
    authorId?: true
    parentId?: true
    createdAt?: true
  }

  export type CommentCountAggregateInputType = {
    id?: true
    content?: true
    postId?: true
    authorId?: true
    parentId?: true
    createdAt?: true
    _all?: true
  }

  export type CommentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Comment to aggregate.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Comments
    **/
    _count?: true | CommentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CommentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CommentMaxAggregateInputType
  }

  export type GetCommentAggregateType<T extends CommentAggregateArgs> = {
        [P in keyof T & keyof AggregateComment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateComment[P]>
      : GetScalarType<T[P], AggregateComment[P]>
  }




  export type CommentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithAggregationInput | CommentOrderByWithAggregationInput[]
    by: CommentScalarFieldEnum[] | CommentScalarFieldEnum
    having?: CommentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CommentCountAggregateInputType | true
    _min?: CommentMinAggregateInputType
    _max?: CommentMaxAggregateInputType
  }

  export type CommentGroupByOutputType = {
    id: string
    content: string
    postId: string
    authorId: string
    parentId: string | null
    createdAt: Date
    _count: CommentCountAggregateOutputType | null
    _min: CommentMinAggregateOutputType | null
    _max: CommentMaxAggregateOutputType | null
  }

  type GetCommentGroupByPayload<T extends CommentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CommentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CommentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CommentGroupByOutputType[P]>
            : GetScalarType<T[P], CommentGroupByOutputType[P]>
        }
      >
    >


  export type CommentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    postId?: boolean
    authorId?: boolean
    parentId?: boolean
    createdAt?: boolean
    post?: boolean | PostDefaultArgs<ExtArgs>
    author?: boolean | UserDefaultArgs<ExtArgs>
    parent?: boolean | Comment$parentArgs<ExtArgs>
    replies?: boolean | Comment$repliesArgs<ExtArgs>
    likes?: boolean | Comment$likesArgs<ExtArgs>
    _count?: boolean | CommentCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["comment"]>

  export type CommentSelectScalar = {
    id?: boolean
    content?: boolean
    postId?: boolean
    authorId?: boolean
    parentId?: boolean
    createdAt?: boolean
  }

  export type CommentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    post?: boolean | PostDefaultArgs<ExtArgs>
    author?: boolean | UserDefaultArgs<ExtArgs>
    parent?: boolean | Comment$parentArgs<ExtArgs>
    replies?: boolean | Comment$repliesArgs<ExtArgs>
    likes?: boolean | Comment$likesArgs<ExtArgs>
    _count?: boolean | CommentCountOutputTypeDefaultArgs<ExtArgs>
  }


  export type $CommentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Comment"
    objects: {
      post: Prisma.$PostPayload<ExtArgs>
      author: Prisma.$UserPayload<ExtArgs>
      parent: Prisma.$CommentPayload<ExtArgs> | null
      replies: Prisma.$CommentPayload<ExtArgs>[]
      likes: Prisma.$CommentLikePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      content: string
      postId: string
      authorId: string
      parentId: string | null
      createdAt: Date
    }, ExtArgs["result"]["comment"]>
    composites: {}
  }


  type CommentGetPayload<S extends boolean | null | undefined | CommentDefaultArgs> = $Result.GetResult<Prisma.$CommentPayload, S>

  type CommentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CommentFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CommentCountAggregateInputType | true
    }

  export interface CommentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Comment'], meta: { name: 'Comment' } }
    /**
     * Find zero or one Comment that matches the filter.
     * @param {CommentFindUniqueArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends CommentFindUniqueArgs<ExtArgs>>(
      args: SelectSubset<T, CommentFindUniqueArgs<ExtArgs>>
    ): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'findUnique'> | null, null, ExtArgs>

    /**
     * Find one Comment that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {CommentFindUniqueOrThrowArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends CommentFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'findUniqueOrThrow'>, never, ExtArgs>

    /**
     * Find the first Comment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindFirstArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends CommentFindFirstArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentFindFirstArgs<ExtArgs>>
    ): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'findFirst'> | null, null, ExtArgs>

    /**
     * Find the first Comment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindFirstOrThrowArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends CommentFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'findFirstOrThrow'>, never, ExtArgs>

    /**
     * Find zero or more Comments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Comments
     * const comments = await prisma.comment.findMany()
     * 
     * // Get first 10 Comments
     * const comments = await prisma.comment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const commentWithIdOnly = await prisma.comment.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends CommentFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'findMany'>>

    /**
     * Create a Comment.
     * @param {CommentCreateArgs} args - Arguments to create a Comment.
     * @example
     * // Create one Comment
     * const Comment = await prisma.comment.create({
     *   data: {
     *     // ... data to create a Comment
     *   }
     * })
     * 
    **/
    create<T extends CommentCreateArgs<ExtArgs>>(
      args: SelectSubset<T, CommentCreateArgs<ExtArgs>>
    ): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'create'>, never, ExtArgs>

    /**
     * Create many Comments.
     *     @param {CommentCreateManyArgs} args - Arguments to create many Comments.
     *     @example
     *     // Create many Comments
     *     const comment = await prisma.comment.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends CommentCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Comment.
     * @param {CommentDeleteArgs} args - Arguments to delete one Comment.
     * @example
     * // Delete one Comment
     * const Comment = await prisma.comment.delete({
     *   where: {
     *     // ... filter to delete one Comment
     *   }
     * })
     * 
    **/
    delete<T extends CommentDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, CommentDeleteArgs<ExtArgs>>
    ): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'delete'>, never, ExtArgs>

    /**
     * Update one Comment.
     * @param {CommentUpdateArgs} args - Arguments to update one Comment.
     * @example
     * // Update one Comment
     * const comment = await prisma.comment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends CommentUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, CommentUpdateArgs<ExtArgs>>
    ): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'update'>, never, ExtArgs>

    /**
     * Delete zero or more Comments.
     * @param {CommentDeleteManyArgs} args - Arguments to filter Comments to delete.
     * @example
     * // Delete a few Comments
     * const { count } = await prisma.comment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends CommentDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Comments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Comments
     * const comment = await prisma.comment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends CommentUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, CommentUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Comment.
     * @param {CommentUpsertArgs} args - Arguments to update or create a Comment.
     * @example
     * // Update or create a Comment
     * const comment = await prisma.comment.upsert({
     *   create: {
     *     // ... data to create a Comment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Comment we want to update
     *   }
     * })
    **/
    upsert<T extends CommentUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, CommentUpsertArgs<ExtArgs>>
    ): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'upsert'>, never, ExtArgs>

    /**
     * Count the number of Comments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentCountArgs} args - Arguments to filter Comments to count.
     * @example
     * // Count the number of Comments
     * const count = await prisma.comment.count({
     *   where: {
     *     // ... the filter for the Comments we want to count
     *   }
     * })
    **/
    count<T extends CommentCountArgs>(
      args?: Subset<T, CommentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CommentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Comment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CommentAggregateArgs>(args: Subset<T, CommentAggregateArgs>): Prisma.PrismaPromise<GetCommentAggregateType<T>>

    /**
     * Group by Comment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CommentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CommentGroupByArgs['orderBy'] }
        : { orderBy?: CommentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CommentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCommentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Comment model
   */
  readonly fields: CommentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Comment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CommentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';

    post<T extends PostDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PostDefaultArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    author<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    parent<T extends Comment$parentArgs<ExtArgs> = {}>(args?: Subset<T, Comment$parentArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'findUniqueOrThrow'> | null, null, ExtArgs>;

    replies<T extends Comment$repliesArgs<ExtArgs> = {}>(args?: Subset<T, Comment$repliesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'findMany'> | Null>;

    likes<T extends Comment$likesArgs<ExtArgs> = {}>(args?: Subset<T, Comment$likesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentLikePayload<ExtArgs>, T, 'findMany'> | Null>;

    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }



  /**
   * Fields of the Comment model
   */ 
  interface CommentFieldRefs {
    readonly id: FieldRef<"Comment", 'String'>
    readonly content: FieldRef<"Comment", 'String'>
    readonly postId: FieldRef<"Comment", 'String'>
    readonly authorId: FieldRef<"Comment", 'String'>
    readonly parentId: FieldRef<"Comment", 'String'>
    readonly createdAt: FieldRef<"Comment", 'DateTime'>
  }
    

  // Custom InputTypes

  /**
   * Comment findUnique
   */
  export type CommentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where: CommentWhereUniqueInput
  }


  /**
   * Comment findUniqueOrThrow
   */
  export type CommentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where: CommentWhereUniqueInput
  }


  /**
   * Comment findFirst
   */
  export type CommentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Comments.
     */
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }


  /**
   * Comment findFirstOrThrow
   */
  export type CommentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Comments.
     */
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }


  /**
   * Comment findMany
   */
  export type CommentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comments to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }


  /**
   * Comment create
   */
  export type CommentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The data needed to create a Comment.
     */
    data: XOR<CommentCreateInput, CommentUncheckedCreateInput>
  }


  /**
   * Comment createMany
   */
  export type CommentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Comments.
     */
    data: CommentCreateManyInput | CommentCreateManyInput[]
    skipDuplicates?: boolean
  }


  /**
   * Comment update
   */
  export type CommentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The data needed to update a Comment.
     */
    data: XOR<CommentUpdateInput, CommentUncheckedUpdateInput>
    /**
     * Choose, which Comment to update.
     */
    where: CommentWhereUniqueInput
  }


  /**
   * Comment updateMany
   */
  export type CommentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Comments.
     */
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyInput>
    /**
     * Filter which Comments to update
     */
    where?: CommentWhereInput
  }


  /**
   * Comment upsert
   */
  export type CommentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The filter to search for the Comment to update in case it exists.
     */
    where: CommentWhereUniqueInput
    /**
     * In case the Comment found by the `where` argument doesn't exist, create a new Comment with this data.
     */
    create: XOR<CommentCreateInput, CommentUncheckedCreateInput>
    /**
     * In case the Comment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CommentUpdateInput, CommentUncheckedUpdateInput>
  }


  /**
   * Comment delete
   */
  export type CommentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter which Comment to delete.
     */
    where: CommentWhereUniqueInput
  }


  /**
   * Comment deleteMany
   */
  export type CommentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Comments to delete
     */
    where?: CommentWhereInput
  }


  /**
   * Comment.parent
   */
  export type Comment$parentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
  }


  /**
   * Comment.replies
   */
  export type Comment$repliesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }


  /**
   * Comment.likes
   */
  export type Comment$likesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
    where?: CommentLikeWhereInput
    orderBy?: CommentLikeOrderByWithRelationInput | CommentLikeOrderByWithRelationInput[]
    cursor?: CommentLikeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentLikeScalarFieldEnum | CommentLikeScalarFieldEnum[]
  }


  /**
   * Comment without action
   */
  export type CommentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentInclude<ExtArgs> | null
  }



  /**
   * Model PostLike
   */

  export type AggregatePostLike = {
    _count: PostLikeCountAggregateOutputType | null
    _min: PostLikeMinAggregateOutputType | null
    _max: PostLikeMaxAggregateOutputType | null
  }

  export type PostLikeMinAggregateOutputType = {
    id: string | null
    postId: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type PostLikeMaxAggregateOutputType = {
    id: string | null
    postId: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type PostLikeCountAggregateOutputType = {
    id: number
    postId: number
    userId: number
    createdAt: number
    _all: number
  }


  export type PostLikeMinAggregateInputType = {
    id?: true
    postId?: true
    userId?: true
    createdAt?: true
  }

  export type PostLikeMaxAggregateInputType = {
    id?: true
    postId?: true
    userId?: true
    createdAt?: true
  }

  export type PostLikeCountAggregateInputType = {
    id?: true
    postId?: true
    userId?: true
    createdAt?: true
    _all?: true
  }

  export type PostLikeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PostLike to aggregate.
     */
    where?: PostLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostLikes to fetch.
     */
    orderBy?: PostLikeOrderByWithRelationInput | PostLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PostLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PostLikes
    **/
    _count?: true | PostLikeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PostLikeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PostLikeMaxAggregateInputType
  }

  export type GetPostLikeAggregateType<T extends PostLikeAggregateArgs> = {
        [P in keyof T & keyof AggregatePostLike]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePostLike[P]>
      : GetScalarType<T[P], AggregatePostLike[P]>
  }




  export type PostLikeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostLikeWhereInput
    orderBy?: PostLikeOrderByWithAggregationInput | PostLikeOrderByWithAggregationInput[]
    by: PostLikeScalarFieldEnum[] | PostLikeScalarFieldEnum
    having?: PostLikeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PostLikeCountAggregateInputType | true
    _min?: PostLikeMinAggregateInputType
    _max?: PostLikeMaxAggregateInputType
  }

  export type PostLikeGroupByOutputType = {
    id: string
    postId: string
    userId: string
    createdAt: Date
    _count: PostLikeCountAggregateOutputType | null
    _min: PostLikeMinAggregateOutputType | null
    _max: PostLikeMaxAggregateOutputType | null
  }

  type GetPostLikeGroupByPayload<T extends PostLikeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PostLikeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PostLikeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PostLikeGroupByOutputType[P]>
            : GetScalarType<T[P], PostLikeGroupByOutputType[P]>
        }
      >
    >


  export type PostLikeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    postId?: boolean
    userId?: boolean
    createdAt?: boolean
    post?: boolean | PostDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["postLike"]>

  export type PostLikeSelectScalar = {
    id?: boolean
    postId?: boolean
    userId?: boolean
    createdAt?: boolean
  }

  export type PostLikeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    post?: boolean | PostDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }


  export type $PostLikePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PostLike"
    objects: {
      post: Prisma.$PostPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      postId: string
      userId: string
      createdAt: Date
    }, ExtArgs["result"]["postLike"]>
    composites: {}
  }


  type PostLikeGetPayload<S extends boolean | null | undefined | PostLikeDefaultArgs> = $Result.GetResult<Prisma.$PostLikePayload, S>

  type PostLikeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PostLikeFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PostLikeCountAggregateInputType | true
    }

  export interface PostLikeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PostLike'], meta: { name: 'PostLike' } }
    /**
     * Find zero or one PostLike that matches the filter.
     * @param {PostLikeFindUniqueArgs} args - Arguments to find a PostLike
     * @example
     * // Get one PostLike
     * const postLike = await prisma.postLike.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends PostLikeFindUniqueArgs<ExtArgs>>(
      args: SelectSubset<T, PostLikeFindUniqueArgs<ExtArgs>>
    ): Prisma__PostLikeClient<$Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, 'findUnique'> | null, null, ExtArgs>

    /**
     * Find one PostLike that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {PostLikeFindUniqueOrThrowArgs} args - Arguments to find a PostLike
     * @example
     * // Get one PostLike
     * const postLike = await prisma.postLike.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends PostLikeFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, PostLikeFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__PostLikeClient<$Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, 'findUniqueOrThrow'>, never, ExtArgs>

    /**
     * Find the first PostLike that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostLikeFindFirstArgs} args - Arguments to find a PostLike
     * @example
     * // Get one PostLike
     * const postLike = await prisma.postLike.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends PostLikeFindFirstArgs<ExtArgs>>(
      args?: SelectSubset<T, PostLikeFindFirstArgs<ExtArgs>>
    ): Prisma__PostLikeClient<$Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, 'findFirst'> | null, null, ExtArgs>

    /**
     * Find the first PostLike that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostLikeFindFirstOrThrowArgs} args - Arguments to find a PostLike
     * @example
     * // Get one PostLike
     * const postLike = await prisma.postLike.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends PostLikeFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, PostLikeFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__PostLikeClient<$Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, 'findFirstOrThrow'>, never, ExtArgs>

    /**
     * Find zero or more PostLikes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostLikeFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PostLikes
     * const postLikes = await prisma.postLike.findMany()
     * 
     * // Get first 10 PostLikes
     * const postLikes = await prisma.postLike.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const postLikeWithIdOnly = await prisma.postLike.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends PostLikeFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, PostLikeFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, 'findMany'>>

    /**
     * Create a PostLike.
     * @param {PostLikeCreateArgs} args - Arguments to create a PostLike.
     * @example
     * // Create one PostLike
     * const PostLike = await prisma.postLike.create({
     *   data: {
     *     // ... data to create a PostLike
     *   }
     * })
     * 
    **/
    create<T extends PostLikeCreateArgs<ExtArgs>>(
      args: SelectSubset<T, PostLikeCreateArgs<ExtArgs>>
    ): Prisma__PostLikeClient<$Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, 'create'>, never, ExtArgs>

    /**
     * Create many PostLikes.
     *     @param {PostLikeCreateManyArgs} args - Arguments to create many PostLikes.
     *     @example
     *     // Create many PostLikes
     *     const postLike = await prisma.postLike.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends PostLikeCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, PostLikeCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a PostLike.
     * @param {PostLikeDeleteArgs} args - Arguments to delete one PostLike.
     * @example
     * // Delete one PostLike
     * const PostLike = await prisma.postLike.delete({
     *   where: {
     *     // ... filter to delete one PostLike
     *   }
     * })
     * 
    **/
    delete<T extends PostLikeDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, PostLikeDeleteArgs<ExtArgs>>
    ): Prisma__PostLikeClient<$Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, 'delete'>, never, ExtArgs>

    /**
     * Update one PostLike.
     * @param {PostLikeUpdateArgs} args - Arguments to update one PostLike.
     * @example
     * // Update one PostLike
     * const postLike = await prisma.postLike.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends PostLikeUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, PostLikeUpdateArgs<ExtArgs>>
    ): Prisma__PostLikeClient<$Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, 'update'>, never, ExtArgs>

    /**
     * Delete zero or more PostLikes.
     * @param {PostLikeDeleteManyArgs} args - Arguments to filter PostLikes to delete.
     * @example
     * // Delete a few PostLikes
     * const { count } = await prisma.postLike.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends PostLikeDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, PostLikeDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PostLikes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostLikeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PostLikes
     * const postLike = await prisma.postLike.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends PostLikeUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, PostLikeUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PostLike.
     * @param {PostLikeUpsertArgs} args - Arguments to update or create a PostLike.
     * @example
     * // Update or create a PostLike
     * const postLike = await prisma.postLike.upsert({
     *   create: {
     *     // ... data to create a PostLike
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PostLike we want to update
     *   }
     * })
    **/
    upsert<T extends PostLikeUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, PostLikeUpsertArgs<ExtArgs>>
    ): Prisma__PostLikeClient<$Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, 'upsert'>, never, ExtArgs>

    /**
     * Count the number of PostLikes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostLikeCountArgs} args - Arguments to filter PostLikes to count.
     * @example
     * // Count the number of PostLikes
     * const count = await prisma.postLike.count({
     *   where: {
     *     // ... the filter for the PostLikes we want to count
     *   }
     * })
    **/
    count<T extends PostLikeCountArgs>(
      args?: Subset<T, PostLikeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PostLikeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PostLike.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostLikeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PostLikeAggregateArgs>(args: Subset<T, PostLikeAggregateArgs>): Prisma.PrismaPromise<GetPostLikeAggregateType<T>>

    /**
     * Group by PostLike.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostLikeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PostLikeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PostLikeGroupByArgs['orderBy'] }
        : { orderBy?: PostLikeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PostLikeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostLikeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PostLike model
   */
  readonly fields: PostLikeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PostLike.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PostLikeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';

    post<T extends PostDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PostDefaultArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }



  /**
   * Fields of the PostLike model
   */ 
  interface PostLikeFieldRefs {
    readonly id: FieldRef<"PostLike", 'String'>
    readonly postId: FieldRef<"PostLike", 'String'>
    readonly userId: FieldRef<"PostLike", 'String'>
    readonly createdAt: FieldRef<"PostLike", 'DateTime'>
  }
    

  // Custom InputTypes

  /**
   * PostLike findUnique
   */
  export type PostLikeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
    /**
     * Filter, which PostLike to fetch.
     */
    where: PostLikeWhereUniqueInput
  }


  /**
   * PostLike findUniqueOrThrow
   */
  export type PostLikeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
    /**
     * Filter, which PostLike to fetch.
     */
    where: PostLikeWhereUniqueInput
  }


  /**
   * PostLike findFirst
   */
  export type PostLikeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
    /**
     * Filter, which PostLike to fetch.
     */
    where?: PostLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostLikes to fetch.
     */
    orderBy?: PostLikeOrderByWithRelationInput | PostLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PostLikes.
     */
    cursor?: PostLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PostLikes.
     */
    distinct?: PostLikeScalarFieldEnum | PostLikeScalarFieldEnum[]
  }


  /**
   * PostLike findFirstOrThrow
   */
  export type PostLikeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
    /**
     * Filter, which PostLike to fetch.
     */
    where?: PostLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostLikes to fetch.
     */
    orderBy?: PostLikeOrderByWithRelationInput | PostLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PostLikes.
     */
    cursor?: PostLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PostLikes.
     */
    distinct?: PostLikeScalarFieldEnum | PostLikeScalarFieldEnum[]
  }


  /**
   * PostLike findMany
   */
  export type PostLikeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
    /**
     * Filter, which PostLikes to fetch.
     */
    where?: PostLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PostLikes to fetch.
     */
    orderBy?: PostLikeOrderByWithRelationInput | PostLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PostLikes.
     */
    cursor?: PostLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PostLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PostLikes.
     */
    skip?: number
    distinct?: PostLikeScalarFieldEnum | PostLikeScalarFieldEnum[]
  }


  /**
   * PostLike create
   */
  export type PostLikeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
    /**
     * The data needed to create a PostLike.
     */
    data: XOR<PostLikeCreateInput, PostLikeUncheckedCreateInput>
  }


  /**
   * PostLike createMany
   */
  export type PostLikeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PostLikes.
     */
    data: PostLikeCreateManyInput | PostLikeCreateManyInput[]
    skipDuplicates?: boolean
  }


  /**
   * PostLike update
   */
  export type PostLikeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
    /**
     * The data needed to update a PostLike.
     */
    data: XOR<PostLikeUpdateInput, PostLikeUncheckedUpdateInput>
    /**
     * Choose, which PostLike to update.
     */
    where: PostLikeWhereUniqueInput
  }


  /**
   * PostLike updateMany
   */
  export type PostLikeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PostLikes.
     */
    data: XOR<PostLikeUpdateManyMutationInput, PostLikeUncheckedUpdateManyInput>
    /**
     * Filter which PostLikes to update
     */
    where?: PostLikeWhereInput
  }


  /**
   * PostLike upsert
   */
  export type PostLikeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
    /**
     * The filter to search for the PostLike to update in case it exists.
     */
    where: PostLikeWhereUniqueInput
    /**
     * In case the PostLike found by the `where` argument doesn't exist, create a new PostLike with this data.
     */
    create: XOR<PostLikeCreateInput, PostLikeUncheckedCreateInput>
    /**
     * In case the PostLike was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PostLikeUpdateInput, PostLikeUncheckedUpdateInput>
  }


  /**
   * PostLike delete
   */
  export type PostLikeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
    /**
     * Filter which PostLike to delete.
     */
    where: PostLikeWhereUniqueInput
  }


  /**
   * PostLike deleteMany
   */
  export type PostLikeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PostLikes to delete
     */
    where?: PostLikeWhereInput
  }


  /**
   * PostLike without action
   */
  export type PostLikeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostLike
     */
    select?: PostLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostLikeInclude<ExtArgs> | null
  }



  /**
   * Model Notification
   */

  export type AggregateNotification = {
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  export type NotificationMinAggregateOutputType = {
    id: string | null
    type: $Enums.NotificationType | null
    isRead: boolean | null
    senderId: string | null
    receiverId: string | null
    postId: string | null
    commentId: string | null
    createdAt: Date | null
  }

  export type NotificationMaxAggregateOutputType = {
    id: string | null
    type: $Enums.NotificationType | null
    isRead: boolean | null
    senderId: string | null
    receiverId: string | null
    postId: string | null
    commentId: string | null
    createdAt: Date | null
  }

  export type NotificationCountAggregateOutputType = {
    id: number
    type: number
    isRead: number
    senderId: number
    receiverId: number
    postId: number
    commentId: number
    createdAt: number
    _all: number
  }


  export type NotificationMinAggregateInputType = {
    id?: true
    type?: true
    isRead?: true
    senderId?: true
    receiverId?: true
    postId?: true
    commentId?: true
    createdAt?: true
  }

  export type NotificationMaxAggregateInputType = {
    id?: true
    type?: true
    isRead?: true
    senderId?: true
    receiverId?: true
    postId?: true
    commentId?: true
    createdAt?: true
  }

  export type NotificationCountAggregateInputType = {
    id?: true
    type?: true
    isRead?: true
    senderId?: true
    receiverId?: true
    postId?: true
    commentId?: true
    createdAt?: true
    _all?: true
  }

  export type NotificationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notification to aggregate.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Notifications
    **/
    _count?: true | NotificationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationMaxAggregateInputType
  }

  export type GetNotificationAggregateType<T extends NotificationAggregateArgs> = {
        [P in keyof T & keyof AggregateNotification]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotification[P]>
      : GetScalarType<T[P], AggregateNotification[P]>
  }




  export type NotificationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithAggregationInput | NotificationOrderByWithAggregationInput[]
    by: NotificationScalarFieldEnum[] | NotificationScalarFieldEnum
    having?: NotificationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationCountAggregateInputType | true
    _min?: NotificationMinAggregateInputType
    _max?: NotificationMaxAggregateInputType
  }

  export type NotificationGroupByOutputType = {
    id: string
    type: $Enums.NotificationType
    isRead: boolean
    senderId: string
    receiverId: string
    postId: string | null
    commentId: string | null
    createdAt: Date
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  type GetNotificationGroupByPayload<T extends NotificationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationGroupByOutputType[P]>
        }
      >
    >


  export type NotificationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    isRead?: boolean
    senderId?: boolean
    receiverId?: boolean
    postId?: boolean
    commentId?: boolean
    createdAt?: boolean
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
    post?: boolean | Notification$postArgs<ExtArgs>
  }, ExtArgs["result"]["notification"]>

  export type NotificationSelectScalar = {
    id?: boolean
    type?: boolean
    isRead?: boolean
    senderId?: boolean
    receiverId?: boolean
    postId?: boolean
    commentId?: boolean
    createdAt?: boolean
  }

  export type NotificationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
    post?: boolean | Notification$postArgs<ExtArgs>
  }


  export type $NotificationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Notification"
    objects: {
      sender: Prisma.$UserPayload<ExtArgs>
      receiver: Prisma.$UserPayload<ExtArgs>
      post: Prisma.$PostPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      type: $Enums.NotificationType
      isRead: boolean
      senderId: string
      receiverId: string
      postId: string | null
      commentId: string | null
      createdAt: Date
    }, ExtArgs["result"]["notification"]>
    composites: {}
  }


  type NotificationGetPayload<S extends boolean | null | undefined | NotificationDefaultArgs> = $Result.GetResult<Prisma.$NotificationPayload, S>

  type NotificationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<NotificationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: NotificationCountAggregateInputType | true
    }

  export interface NotificationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Notification'], meta: { name: 'Notification' } }
    /**
     * Find zero or one Notification that matches the filter.
     * @param {NotificationFindUniqueArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends NotificationFindUniqueArgs<ExtArgs>>(
      args: SelectSubset<T, NotificationFindUniqueArgs<ExtArgs>>
    ): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'findUnique'> | null, null, ExtArgs>

    /**
     * Find one Notification that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {NotificationFindUniqueOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends NotificationFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, NotificationFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'findUniqueOrThrow'>, never, ExtArgs>

    /**
     * Find the first Notification that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends NotificationFindFirstArgs<ExtArgs>>(
      args?: SelectSubset<T, NotificationFindFirstArgs<ExtArgs>>
    ): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'findFirst'> | null, null, ExtArgs>

    /**
     * Find the first Notification that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends NotificationFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, NotificationFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'findFirstOrThrow'>, never, ExtArgs>

    /**
     * Find zero or more Notifications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Notifications
     * const notifications = await prisma.notification.findMany()
     * 
     * // Get first 10 Notifications
     * const notifications = await prisma.notification.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationWithIdOnly = await prisma.notification.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends NotificationFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, NotificationFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'findMany'>>

    /**
     * Create a Notification.
     * @param {NotificationCreateArgs} args - Arguments to create a Notification.
     * @example
     * // Create one Notification
     * const Notification = await prisma.notification.create({
     *   data: {
     *     // ... data to create a Notification
     *   }
     * })
     * 
    **/
    create<T extends NotificationCreateArgs<ExtArgs>>(
      args: SelectSubset<T, NotificationCreateArgs<ExtArgs>>
    ): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'create'>, never, ExtArgs>

    /**
     * Create many Notifications.
     *     @param {NotificationCreateManyArgs} args - Arguments to create many Notifications.
     *     @example
     *     // Create many Notifications
     *     const notification = await prisma.notification.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends NotificationCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, NotificationCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Notification.
     * @param {NotificationDeleteArgs} args - Arguments to delete one Notification.
     * @example
     * // Delete one Notification
     * const Notification = await prisma.notification.delete({
     *   where: {
     *     // ... filter to delete one Notification
     *   }
     * })
     * 
    **/
    delete<T extends NotificationDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, NotificationDeleteArgs<ExtArgs>>
    ): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'delete'>, never, ExtArgs>

    /**
     * Update one Notification.
     * @param {NotificationUpdateArgs} args - Arguments to update one Notification.
     * @example
     * // Update one Notification
     * const notification = await prisma.notification.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends NotificationUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, NotificationUpdateArgs<ExtArgs>>
    ): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'update'>, never, ExtArgs>

    /**
     * Delete zero or more Notifications.
     * @param {NotificationDeleteManyArgs} args - Arguments to filter Notifications to delete.
     * @example
     * // Delete a few Notifications
     * const { count } = await prisma.notification.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends NotificationDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, NotificationDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Notifications
     * const notification = await prisma.notification.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends NotificationUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, NotificationUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Notification.
     * @param {NotificationUpsertArgs} args - Arguments to update or create a Notification.
     * @example
     * // Update or create a Notification
     * const notification = await prisma.notification.upsert({
     *   create: {
     *     // ... data to create a Notification
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Notification we want to update
     *   }
     * })
    **/
    upsert<T extends NotificationUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, NotificationUpsertArgs<ExtArgs>>
    ): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, 'upsert'>, never, ExtArgs>

    /**
     * Count the number of Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationCountArgs} args - Arguments to filter Notifications to count.
     * @example
     * // Count the number of Notifications
     * const count = await prisma.notification.count({
     *   where: {
     *     // ... the filter for the Notifications we want to count
     *   }
     * })
    **/
    count<T extends NotificationCountArgs>(
      args?: Subset<T, NotificationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NotificationAggregateArgs>(args: Subset<T, NotificationAggregateArgs>): Prisma.PrismaPromise<GetNotificationAggregateType<T>>

    /**
     * Group by Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NotificationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationGroupByArgs['orderBy'] }
        : { orderBy?: NotificationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NotificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Notification model
   */
  readonly fields: NotificationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Notification.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';

    sender<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    receiver<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    post<T extends Notification$postArgs<ExtArgs> = {}>(args?: Subset<T, Notification$postArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findUniqueOrThrow'> | null, null, ExtArgs>;

    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }



  /**
   * Fields of the Notification model
   */ 
  interface NotificationFieldRefs {
    readonly id: FieldRef<"Notification", 'String'>
    readonly type: FieldRef<"Notification", 'NotificationType'>
    readonly isRead: FieldRef<"Notification", 'Boolean'>
    readonly senderId: FieldRef<"Notification", 'String'>
    readonly receiverId: FieldRef<"Notification", 'String'>
    readonly postId: FieldRef<"Notification", 'String'>
    readonly commentId: FieldRef<"Notification", 'String'>
    readonly createdAt: FieldRef<"Notification", 'DateTime'>
  }
    

  // Custom InputTypes

  /**
   * Notification findUnique
   */
  export type NotificationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }


  /**
   * Notification findUniqueOrThrow
   */
  export type NotificationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }


  /**
   * Notification findFirst
   */
  export type NotificationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }


  /**
   * Notification findFirstOrThrow
   */
  export type NotificationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }


  /**
   * Notification findMany
   */
  export type NotificationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notifications to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }


  /**
   * Notification create
   */
  export type NotificationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The data needed to create a Notification.
     */
    data: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
  }


  /**
   * Notification createMany
   */
  export type NotificationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Notifications.
     */
    data: NotificationCreateManyInput | NotificationCreateManyInput[]
    skipDuplicates?: boolean
  }


  /**
   * Notification update
   */
  export type NotificationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The data needed to update a Notification.
     */
    data: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
    /**
     * Choose, which Notification to update.
     */
    where: NotificationWhereUniqueInput
  }


  /**
   * Notification updateMany
   */
  export type NotificationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Notifications.
     */
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyInput>
    /**
     * Filter which Notifications to update
     */
    where?: NotificationWhereInput
  }


  /**
   * Notification upsert
   */
  export type NotificationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The filter to search for the Notification to update in case it exists.
     */
    where: NotificationWhereUniqueInput
    /**
     * In case the Notification found by the `where` argument doesn't exist, create a new Notification with this data.
     */
    create: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
    /**
     * In case the Notification was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
  }


  /**
   * Notification delete
   */
  export type NotificationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter which Notification to delete.
     */
    where: NotificationWhereUniqueInput
  }


  /**
   * Notification deleteMany
   */
  export type NotificationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notifications to delete
     */
    where?: NotificationWhereInput
  }


  /**
   * Notification.post
   */
  export type Notification$postArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: PostInclude<ExtArgs> | null
    where?: PostWhereInput
  }


  /**
   * Notification without action
   */
  export type NotificationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: NotificationInclude<ExtArgs> | null
  }



  /**
   * Model CommentLike
   */

  export type AggregateCommentLike = {
    _count: CommentLikeCountAggregateOutputType | null
    _min: CommentLikeMinAggregateOutputType | null
    _max: CommentLikeMaxAggregateOutputType | null
  }

  export type CommentLikeMinAggregateOutputType = {
    id: string | null
    commentId: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type CommentLikeMaxAggregateOutputType = {
    id: string | null
    commentId: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type CommentLikeCountAggregateOutputType = {
    id: number
    commentId: number
    userId: number
    createdAt: number
    _all: number
  }


  export type CommentLikeMinAggregateInputType = {
    id?: true
    commentId?: true
    userId?: true
    createdAt?: true
  }

  export type CommentLikeMaxAggregateInputType = {
    id?: true
    commentId?: true
    userId?: true
    createdAt?: true
  }

  export type CommentLikeCountAggregateInputType = {
    id?: true
    commentId?: true
    userId?: true
    createdAt?: true
    _all?: true
  }

  export type CommentLikeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CommentLike to aggregate.
     */
    where?: CommentLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommentLikes to fetch.
     */
    orderBy?: CommentLikeOrderByWithRelationInput | CommentLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CommentLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommentLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommentLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CommentLikes
    **/
    _count?: true | CommentLikeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CommentLikeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CommentLikeMaxAggregateInputType
  }

  export type GetCommentLikeAggregateType<T extends CommentLikeAggregateArgs> = {
        [P in keyof T & keyof AggregateCommentLike]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCommentLike[P]>
      : GetScalarType<T[P], AggregateCommentLike[P]>
  }




  export type CommentLikeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentLikeWhereInput
    orderBy?: CommentLikeOrderByWithAggregationInput | CommentLikeOrderByWithAggregationInput[]
    by: CommentLikeScalarFieldEnum[] | CommentLikeScalarFieldEnum
    having?: CommentLikeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CommentLikeCountAggregateInputType | true
    _min?: CommentLikeMinAggregateInputType
    _max?: CommentLikeMaxAggregateInputType
  }

  export type CommentLikeGroupByOutputType = {
    id: string
    commentId: string
    userId: string
    createdAt: Date
    _count: CommentLikeCountAggregateOutputType | null
    _min: CommentLikeMinAggregateOutputType | null
    _max: CommentLikeMaxAggregateOutputType | null
  }

  type GetCommentLikeGroupByPayload<T extends CommentLikeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CommentLikeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CommentLikeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CommentLikeGroupByOutputType[P]>
            : GetScalarType<T[P], CommentLikeGroupByOutputType[P]>
        }
      >
    >


  export type CommentLikeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    commentId?: boolean
    userId?: boolean
    createdAt?: boolean
    comment?: boolean | CommentDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["commentLike"]>

  export type CommentLikeSelectScalar = {
    id?: boolean
    commentId?: boolean
    userId?: boolean
    createdAt?: boolean
  }

  export type CommentLikeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comment?: boolean | CommentDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }


  export type $CommentLikePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CommentLike"
    objects: {
      comment: Prisma.$CommentPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      commentId: string
      userId: string
      createdAt: Date
    }, ExtArgs["result"]["commentLike"]>
    composites: {}
  }


  type CommentLikeGetPayload<S extends boolean | null | undefined | CommentLikeDefaultArgs> = $Result.GetResult<Prisma.$CommentLikePayload, S>

  type CommentLikeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CommentLikeFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CommentLikeCountAggregateInputType | true
    }

  export interface CommentLikeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CommentLike'], meta: { name: 'CommentLike' } }
    /**
     * Find zero or one CommentLike that matches the filter.
     * @param {CommentLikeFindUniqueArgs} args - Arguments to find a CommentLike
     * @example
     * // Get one CommentLike
     * const commentLike = await prisma.commentLike.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends CommentLikeFindUniqueArgs<ExtArgs>>(
      args: SelectSubset<T, CommentLikeFindUniqueArgs<ExtArgs>>
    ): Prisma__CommentLikeClient<$Result.GetResult<Prisma.$CommentLikePayload<ExtArgs>, T, 'findUnique'> | null, null, ExtArgs>

    /**
     * Find one CommentLike that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {CommentLikeFindUniqueOrThrowArgs} args - Arguments to find a CommentLike
     * @example
     * // Get one CommentLike
     * const commentLike = await prisma.commentLike.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends CommentLikeFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentLikeFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__CommentLikeClient<$Result.GetResult<Prisma.$CommentLikePayload<ExtArgs>, T, 'findUniqueOrThrow'>, never, ExtArgs>

    /**
     * Find the first CommentLike that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentLikeFindFirstArgs} args - Arguments to find a CommentLike
     * @example
     * // Get one CommentLike
     * const commentLike = await prisma.commentLike.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends CommentLikeFindFirstArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentLikeFindFirstArgs<ExtArgs>>
    ): Prisma__CommentLikeClient<$Result.GetResult<Prisma.$CommentLikePayload<ExtArgs>, T, 'findFirst'> | null, null, ExtArgs>

    /**
     * Find the first CommentLike that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentLikeFindFirstOrThrowArgs} args - Arguments to find a CommentLike
     * @example
     * // Get one CommentLike
     * const commentLike = await prisma.commentLike.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends CommentLikeFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentLikeFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__CommentLikeClient<$Result.GetResult<Prisma.$CommentLikePayload<ExtArgs>, T, 'findFirstOrThrow'>, never, ExtArgs>

    /**
     * Find zero or more CommentLikes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentLikeFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CommentLikes
     * const commentLikes = await prisma.commentLike.findMany()
     * 
     * // Get first 10 CommentLikes
     * const commentLikes = await prisma.commentLike.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const commentLikeWithIdOnly = await prisma.commentLike.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends CommentLikeFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentLikeFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentLikePayload<ExtArgs>, T, 'findMany'>>

    /**
     * Create a CommentLike.
     * @param {CommentLikeCreateArgs} args - Arguments to create a CommentLike.
     * @example
     * // Create one CommentLike
     * const CommentLike = await prisma.commentLike.create({
     *   data: {
     *     // ... data to create a CommentLike
     *   }
     * })
     * 
    **/
    create<T extends CommentLikeCreateArgs<ExtArgs>>(
      args: SelectSubset<T, CommentLikeCreateArgs<ExtArgs>>
    ): Prisma__CommentLikeClient<$Result.GetResult<Prisma.$CommentLikePayload<ExtArgs>, T, 'create'>, never, ExtArgs>

    /**
     * Create many CommentLikes.
     *     @param {CommentLikeCreateManyArgs} args - Arguments to create many CommentLikes.
     *     @example
     *     // Create many CommentLikes
     *     const commentLike = await prisma.commentLike.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends CommentLikeCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentLikeCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a CommentLike.
     * @param {CommentLikeDeleteArgs} args - Arguments to delete one CommentLike.
     * @example
     * // Delete one CommentLike
     * const CommentLike = await prisma.commentLike.delete({
     *   where: {
     *     // ... filter to delete one CommentLike
     *   }
     * })
     * 
    **/
    delete<T extends CommentLikeDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, CommentLikeDeleteArgs<ExtArgs>>
    ): Prisma__CommentLikeClient<$Result.GetResult<Prisma.$CommentLikePayload<ExtArgs>, T, 'delete'>, never, ExtArgs>

    /**
     * Update one CommentLike.
     * @param {CommentLikeUpdateArgs} args - Arguments to update one CommentLike.
     * @example
     * // Update one CommentLike
     * const commentLike = await prisma.commentLike.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends CommentLikeUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, CommentLikeUpdateArgs<ExtArgs>>
    ): Prisma__CommentLikeClient<$Result.GetResult<Prisma.$CommentLikePayload<ExtArgs>, T, 'update'>, never, ExtArgs>

    /**
     * Delete zero or more CommentLikes.
     * @param {CommentLikeDeleteManyArgs} args - Arguments to filter CommentLikes to delete.
     * @example
     * // Delete a few CommentLikes
     * const { count } = await prisma.commentLike.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends CommentLikeDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, CommentLikeDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CommentLikes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentLikeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CommentLikes
     * const commentLike = await prisma.commentLike.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends CommentLikeUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, CommentLikeUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CommentLike.
     * @param {CommentLikeUpsertArgs} args - Arguments to update or create a CommentLike.
     * @example
     * // Update or create a CommentLike
     * const commentLike = await prisma.commentLike.upsert({
     *   create: {
     *     // ... data to create a CommentLike
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CommentLike we want to update
     *   }
     * })
    **/
    upsert<T extends CommentLikeUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, CommentLikeUpsertArgs<ExtArgs>>
    ): Prisma__CommentLikeClient<$Result.GetResult<Prisma.$CommentLikePayload<ExtArgs>, T, 'upsert'>, never, ExtArgs>

    /**
     * Count the number of CommentLikes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentLikeCountArgs} args - Arguments to filter CommentLikes to count.
     * @example
     * // Count the number of CommentLikes
     * const count = await prisma.commentLike.count({
     *   where: {
     *     // ... the filter for the CommentLikes we want to count
     *   }
     * })
    **/
    count<T extends CommentLikeCountArgs>(
      args?: Subset<T, CommentLikeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CommentLikeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CommentLike.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentLikeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CommentLikeAggregateArgs>(args: Subset<T, CommentLikeAggregateArgs>): Prisma.PrismaPromise<GetCommentLikeAggregateType<T>>

    /**
     * Group by CommentLike.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentLikeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CommentLikeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CommentLikeGroupByArgs['orderBy'] }
        : { orderBy?: CommentLikeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CommentLikeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCommentLikeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CommentLike model
   */
  readonly fields: CommentLikeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CommentLike.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CommentLikeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';

    comment<T extends CommentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CommentDefaultArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }



  /**
   * Fields of the CommentLike model
   */ 
  interface CommentLikeFieldRefs {
    readonly id: FieldRef<"CommentLike", 'String'>
    readonly commentId: FieldRef<"CommentLike", 'String'>
    readonly userId: FieldRef<"CommentLike", 'String'>
    readonly createdAt: FieldRef<"CommentLike", 'DateTime'>
  }
    

  // Custom InputTypes

  /**
   * CommentLike findUnique
   */
  export type CommentLikeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
    /**
     * Filter, which CommentLike to fetch.
     */
    where: CommentLikeWhereUniqueInput
  }


  /**
   * CommentLike findUniqueOrThrow
   */
  export type CommentLikeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
    /**
     * Filter, which CommentLike to fetch.
     */
    where: CommentLikeWhereUniqueInput
  }


  /**
   * CommentLike findFirst
   */
  export type CommentLikeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
    /**
     * Filter, which CommentLike to fetch.
     */
    where?: CommentLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommentLikes to fetch.
     */
    orderBy?: CommentLikeOrderByWithRelationInput | CommentLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CommentLikes.
     */
    cursor?: CommentLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommentLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommentLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CommentLikes.
     */
    distinct?: CommentLikeScalarFieldEnum | CommentLikeScalarFieldEnum[]
  }


  /**
   * CommentLike findFirstOrThrow
   */
  export type CommentLikeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
    /**
     * Filter, which CommentLike to fetch.
     */
    where?: CommentLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommentLikes to fetch.
     */
    orderBy?: CommentLikeOrderByWithRelationInput | CommentLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CommentLikes.
     */
    cursor?: CommentLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommentLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommentLikes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CommentLikes.
     */
    distinct?: CommentLikeScalarFieldEnum | CommentLikeScalarFieldEnum[]
  }


  /**
   * CommentLike findMany
   */
  export type CommentLikeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
    /**
     * Filter, which CommentLikes to fetch.
     */
    where?: CommentLikeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommentLikes to fetch.
     */
    orderBy?: CommentLikeOrderByWithRelationInput | CommentLikeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CommentLikes.
     */
    cursor?: CommentLikeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommentLikes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommentLikes.
     */
    skip?: number
    distinct?: CommentLikeScalarFieldEnum | CommentLikeScalarFieldEnum[]
  }


  /**
   * CommentLike create
   */
  export type CommentLikeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
    /**
     * The data needed to create a CommentLike.
     */
    data: XOR<CommentLikeCreateInput, CommentLikeUncheckedCreateInput>
  }


  /**
   * CommentLike createMany
   */
  export type CommentLikeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CommentLikes.
     */
    data: CommentLikeCreateManyInput | CommentLikeCreateManyInput[]
    skipDuplicates?: boolean
  }


  /**
   * CommentLike update
   */
  export type CommentLikeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
    /**
     * The data needed to update a CommentLike.
     */
    data: XOR<CommentLikeUpdateInput, CommentLikeUncheckedUpdateInput>
    /**
     * Choose, which CommentLike to update.
     */
    where: CommentLikeWhereUniqueInput
  }


  /**
   * CommentLike updateMany
   */
  export type CommentLikeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CommentLikes.
     */
    data: XOR<CommentLikeUpdateManyMutationInput, CommentLikeUncheckedUpdateManyInput>
    /**
     * Filter which CommentLikes to update
     */
    where?: CommentLikeWhereInput
  }


  /**
   * CommentLike upsert
   */
  export type CommentLikeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
    /**
     * The filter to search for the CommentLike to update in case it exists.
     */
    where: CommentLikeWhereUniqueInput
    /**
     * In case the CommentLike found by the `where` argument doesn't exist, create a new CommentLike with this data.
     */
    create: XOR<CommentLikeCreateInput, CommentLikeUncheckedCreateInput>
    /**
     * In case the CommentLike was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CommentLikeUpdateInput, CommentLikeUncheckedUpdateInput>
  }


  /**
   * CommentLike delete
   */
  export type CommentLikeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
    /**
     * Filter which CommentLike to delete.
     */
    where: CommentLikeWhereUniqueInput
  }


  /**
   * CommentLike deleteMany
   */
  export type CommentLikeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CommentLikes to delete
     */
    where?: CommentLikeWhereInput
  }


  /**
   * CommentLike without action
   */
  export type CommentLikeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommentLike
     */
    select?: CommentLikeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: CommentLikeInclude<ExtArgs> | null
  }



  /**
   * Model Repost
   */

  export type AggregateRepost = {
    _count: RepostCountAggregateOutputType | null
    _min: RepostMinAggregateOutputType | null
    _max: RepostMaxAggregateOutputType | null
  }

  export type RepostMinAggregateOutputType = {
    id: string | null
    postId: string | null
    userId: string | null
  }

  export type RepostMaxAggregateOutputType = {
    id: string | null
    postId: string | null
    userId: string | null
  }

  export type RepostCountAggregateOutputType = {
    id: number
    postId: number
    userId: number
    _all: number
  }


  export type RepostMinAggregateInputType = {
    id?: true
    postId?: true
    userId?: true
  }

  export type RepostMaxAggregateInputType = {
    id?: true
    postId?: true
    userId?: true
  }

  export type RepostCountAggregateInputType = {
    id?: true
    postId?: true
    userId?: true
    _all?: true
  }

  export type RepostAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Repost to aggregate.
     */
    where?: RepostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reposts to fetch.
     */
    orderBy?: RepostOrderByWithRelationInput | RepostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RepostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reposts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reposts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Reposts
    **/
    _count?: true | RepostCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RepostMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RepostMaxAggregateInputType
  }

  export type GetRepostAggregateType<T extends RepostAggregateArgs> = {
        [P in keyof T & keyof AggregateRepost]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRepost[P]>
      : GetScalarType<T[P], AggregateRepost[P]>
  }




  export type RepostGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RepostWhereInput
    orderBy?: RepostOrderByWithAggregationInput | RepostOrderByWithAggregationInput[]
    by: RepostScalarFieldEnum[] | RepostScalarFieldEnum
    having?: RepostScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RepostCountAggregateInputType | true
    _min?: RepostMinAggregateInputType
    _max?: RepostMaxAggregateInputType
  }

  export type RepostGroupByOutputType = {
    id: string
    postId: string
    userId: string
    _count: RepostCountAggregateOutputType | null
    _min: RepostMinAggregateOutputType | null
    _max: RepostMaxAggregateOutputType | null
  }

  type GetRepostGroupByPayload<T extends RepostGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RepostGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RepostGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RepostGroupByOutputType[P]>
            : GetScalarType<T[P], RepostGroupByOutputType[P]>
        }
      >
    >


  export type RepostSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    postId?: boolean
    userId?: boolean
    post?: boolean | PostDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["repost"]>

  export type RepostSelectScalar = {
    id?: boolean
    postId?: boolean
    userId?: boolean
  }

  export type RepostInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    post?: boolean | PostDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }


  export type $RepostPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Repost"
    objects: {
      post: Prisma.$PostPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      postId: string
      userId: string
    }, ExtArgs["result"]["repost"]>
    composites: {}
  }


  type RepostGetPayload<S extends boolean | null | undefined | RepostDefaultArgs> = $Result.GetResult<Prisma.$RepostPayload, S>

  type RepostCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<RepostFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: RepostCountAggregateInputType | true
    }

  export interface RepostDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Repost'], meta: { name: 'Repost' } }
    /**
     * Find zero or one Repost that matches the filter.
     * @param {RepostFindUniqueArgs} args - Arguments to find a Repost
     * @example
     * // Get one Repost
     * const repost = await prisma.repost.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUnique<T extends RepostFindUniqueArgs<ExtArgs>>(
      args: SelectSubset<T, RepostFindUniqueArgs<ExtArgs>>
    ): Prisma__RepostClient<$Result.GetResult<Prisma.$RepostPayload<ExtArgs>, T, 'findUnique'> | null, null, ExtArgs>

    /**
     * Find one Repost that matches the filter or throw an error  with `error.code='P2025'` 
     *     if no matches were found.
     * @param {RepostFindUniqueOrThrowArgs} args - Arguments to find a Repost
     * @example
     * // Get one Repost
     * const repost = await prisma.repost.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findUniqueOrThrow<T extends RepostFindUniqueOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, RepostFindUniqueOrThrowArgs<ExtArgs>>
    ): Prisma__RepostClient<$Result.GetResult<Prisma.$RepostPayload<ExtArgs>, T, 'findUniqueOrThrow'>, never, ExtArgs>

    /**
     * Find the first Repost that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RepostFindFirstArgs} args - Arguments to find a Repost
     * @example
     * // Get one Repost
     * const repost = await prisma.repost.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirst<T extends RepostFindFirstArgs<ExtArgs>>(
      args?: SelectSubset<T, RepostFindFirstArgs<ExtArgs>>
    ): Prisma__RepostClient<$Result.GetResult<Prisma.$RepostPayload<ExtArgs>, T, 'findFirst'> | null, null, ExtArgs>

    /**
     * Find the first Repost that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RepostFindFirstOrThrowArgs} args - Arguments to find a Repost
     * @example
     * // Get one Repost
     * const repost = await prisma.repost.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
    **/
    findFirstOrThrow<T extends RepostFindFirstOrThrowArgs<ExtArgs>>(
      args?: SelectSubset<T, RepostFindFirstOrThrowArgs<ExtArgs>>
    ): Prisma__RepostClient<$Result.GetResult<Prisma.$RepostPayload<ExtArgs>, T, 'findFirstOrThrow'>, never, ExtArgs>

    /**
     * Find zero or more Reposts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RepostFindManyArgs=} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Reposts
     * const reposts = await prisma.repost.findMany()
     * 
     * // Get first 10 Reposts
     * const reposts = await prisma.repost.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const repostWithIdOnly = await prisma.repost.findMany({ select: { id: true } })
     * 
    **/
    findMany<T extends RepostFindManyArgs<ExtArgs>>(
      args?: SelectSubset<T, RepostFindManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RepostPayload<ExtArgs>, T, 'findMany'>>

    /**
     * Create a Repost.
     * @param {RepostCreateArgs} args - Arguments to create a Repost.
     * @example
     * // Create one Repost
     * const Repost = await prisma.repost.create({
     *   data: {
     *     // ... data to create a Repost
     *   }
     * })
     * 
    **/
    create<T extends RepostCreateArgs<ExtArgs>>(
      args: SelectSubset<T, RepostCreateArgs<ExtArgs>>
    ): Prisma__RepostClient<$Result.GetResult<Prisma.$RepostPayload<ExtArgs>, T, 'create'>, never, ExtArgs>

    /**
     * Create many Reposts.
     *     @param {RepostCreateManyArgs} args - Arguments to create many Reposts.
     *     @example
     *     // Create many Reposts
     *     const repost = await prisma.repost.createMany({
     *       data: {
     *         // ... provide data here
     *       }
     *     })
     *     
    **/
    createMany<T extends RepostCreateManyArgs<ExtArgs>>(
      args?: SelectSubset<T, RepostCreateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Repost.
     * @param {RepostDeleteArgs} args - Arguments to delete one Repost.
     * @example
     * // Delete one Repost
     * const Repost = await prisma.repost.delete({
     *   where: {
     *     // ... filter to delete one Repost
     *   }
     * })
     * 
    **/
    delete<T extends RepostDeleteArgs<ExtArgs>>(
      args: SelectSubset<T, RepostDeleteArgs<ExtArgs>>
    ): Prisma__RepostClient<$Result.GetResult<Prisma.$RepostPayload<ExtArgs>, T, 'delete'>, never, ExtArgs>

    /**
     * Update one Repost.
     * @param {RepostUpdateArgs} args - Arguments to update one Repost.
     * @example
     * // Update one Repost
     * const repost = await prisma.repost.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    update<T extends RepostUpdateArgs<ExtArgs>>(
      args: SelectSubset<T, RepostUpdateArgs<ExtArgs>>
    ): Prisma__RepostClient<$Result.GetResult<Prisma.$RepostPayload<ExtArgs>, T, 'update'>, never, ExtArgs>

    /**
     * Delete zero or more Reposts.
     * @param {RepostDeleteManyArgs} args - Arguments to filter Reposts to delete.
     * @example
     * // Delete a few Reposts
     * const { count } = await prisma.repost.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
    **/
    deleteMany<T extends RepostDeleteManyArgs<ExtArgs>>(
      args?: SelectSubset<T, RepostDeleteManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Reposts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RepostUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Reposts
     * const repost = await prisma.repost.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
    **/
    updateMany<T extends RepostUpdateManyArgs<ExtArgs>>(
      args: SelectSubset<T, RepostUpdateManyArgs<ExtArgs>>
    ): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Repost.
     * @param {RepostUpsertArgs} args - Arguments to update or create a Repost.
     * @example
     * // Update or create a Repost
     * const repost = await prisma.repost.upsert({
     *   create: {
     *     // ... data to create a Repost
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Repost we want to update
     *   }
     * })
    **/
    upsert<T extends RepostUpsertArgs<ExtArgs>>(
      args: SelectSubset<T, RepostUpsertArgs<ExtArgs>>
    ): Prisma__RepostClient<$Result.GetResult<Prisma.$RepostPayload<ExtArgs>, T, 'upsert'>, never, ExtArgs>

    /**
     * Count the number of Reposts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RepostCountArgs} args - Arguments to filter Reposts to count.
     * @example
     * // Count the number of Reposts
     * const count = await prisma.repost.count({
     *   where: {
     *     // ... the filter for the Reposts we want to count
     *   }
     * })
    **/
    count<T extends RepostCountArgs>(
      args?: Subset<T, RepostCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RepostCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Repost.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RepostAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RepostAggregateArgs>(args: Subset<T, RepostAggregateArgs>): Prisma.PrismaPromise<GetRepostAggregateType<T>>

    /**
     * Group by Repost.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RepostGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RepostGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RepostGroupByArgs['orderBy'] }
        : { orderBy?: RepostGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RepostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRepostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Repost model
   */
  readonly fields: RepostFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Repost.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RepostClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';

    post<T extends PostDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PostDefaultArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, 'findUniqueOrThrow'> | Null, Null, ExtArgs>;

    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }



  /**
   * Fields of the Repost model
   */ 
  interface RepostFieldRefs {
    readonly id: FieldRef<"Repost", 'String'>
    readonly postId: FieldRef<"Repost", 'String'>
    readonly userId: FieldRef<"Repost", 'String'>
  }
    

  // Custom InputTypes

  /**
   * Repost findUnique
   */
  export type RepostFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
    /**
     * Filter, which Repost to fetch.
     */
    where: RepostWhereUniqueInput
  }


  /**
   * Repost findUniqueOrThrow
   */
  export type RepostFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
    /**
     * Filter, which Repost to fetch.
     */
    where: RepostWhereUniqueInput
  }


  /**
   * Repost findFirst
   */
  export type RepostFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
    /**
     * Filter, which Repost to fetch.
     */
    where?: RepostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reposts to fetch.
     */
    orderBy?: RepostOrderByWithRelationInput | RepostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Reposts.
     */
    cursor?: RepostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reposts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reposts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Reposts.
     */
    distinct?: RepostScalarFieldEnum | RepostScalarFieldEnum[]
  }


  /**
   * Repost findFirstOrThrow
   */
  export type RepostFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
    /**
     * Filter, which Repost to fetch.
     */
    where?: RepostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reposts to fetch.
     */
    orderBy?: RepostOrderByWithRelationInput | RepostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Reposts.
     */
    cursor?: RepostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reposts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reposts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Reposts.
     */
    distinct?: RepostScalarFieldEnum | RepostScalarFieldEnum[]
  }


  /**
   * Repost findMany
   */
  export type RepostFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
    /**
     * Filter, which Reposts to fetch.
     */
    where?: RepostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reposts to fetch.
     */
    orderBy?: RepostOrderByWithRelationInput | RepostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Reposts.
     */
    cursor?: RepostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reposts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reposts.
     */
    skip?: number
    distinct?: RepostScalarFieldEnum | RepostScalarFieldEnum[]
  }


  /**
   * Repost create
   */
  export type RepostCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
    /**
     * The data needed to create a Repost.
     */
    data: XOR<RepostCreateInput, RepostUncheckedCreateInput>
  }


  /**
   * Repost createMany
   */
  export type RepostCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Reposts.
     */
    data: RepostCreateManyInput | RepostCreateManyInput[]
    skipDuplicates?: boolean
  }


  /**
   * Repost update
   */
  export type RepostUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
    /**
     * The data needed to update a Repost.
     */
    data: XOR<RepostUpdateInput, RepostUncheckedUpdateInput>
    /**
     * Choose, which Repost to update.
     */
    where: RepostWhereUniqueInput
  }


  /**
   * Repost updateMany
   */
  export type RepostUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Reposts.
     */
    data: XOR<RepostUpdateManyMutationInput, RepostUncheckedUpdateManyInput>
    /**
     * Filter which Reposts to update
     */
    where?: RepostWhereInput
  }


  /**
   * Repost upsert
   */
  export type RepostUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
    /**
     * The filter to search for the Repost to update in case it exists.
     */
    where: RepostWhereUniqueInput
    /**
     * In case the Repost found by the `where` argument doesn't exist, create a new Repost with this data.
     */
    create: XOR<RepostCreateInput, RepostUncheckedCreateInput>
    /**
     * In case the Repost was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RepostUpdateInput, RepostUncheckedUpdateInput>
  }


  /**
   * Repost delete
   */
  export type RepostDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
    /**
     * Filter which Repost to delete.
     */
    where: RepostWhereUniqueInput
  }


  /**
   * Repost deleteMany
   */
  export type RepostDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Reposts to delete
     */
    where?: RepostWhereInput
  }


  /**
   * Repost without action
   */
  export type RepostDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Repost
     */
    select?: RepostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well.
     */
    include?: RepostInclude<ExtArgs> | null
  }



  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    password: 'password',
    name: 'name',
    role: 'role',
    banned: 'banned',
    avatar: 'avatar',
    bio: 'bio',
    postViewMode: 'postViewMode',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const PostScalarFieldEnum: {
    id: 'id',
    title: 'title',
    content: 'content',
    authorId: 'authorId',
    topicId: 'topicId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PostScalarFieldEnum = (typeof PostScalarFieldEnum)[keyof typeof PostScalarFieldEnum]


  export const TopicScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    icon: 'icon',
    creatorId: 'creatorId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TopicScalarFieldEnum = (typeof TopicScalarFieldEnum)[keyof typeof TopicScalarFieldEnum]


  export const PostImageScalarFieldEnum: {
    id: 'id',
    url: 'url',
    postId: 'postId',
    createdAt: 'createdAt'
  };

  export type PostImageScalarFieldEnum = (typeof PostImageScalarFieldEnum)[keyof typeof PostImageScalarFieldEnum]


  export const CommentScalarFieldEnum: {
    id: 'id',
    content: 'content',
    postId: 'postId',
    authorId: 'authorId',
    parentId: 'parentId',
    createdAt: 'createdAt'
  };

  export type CommentScalarFieldEnum = (typeof CommentScalarFieldEnum)[keyof typeof CommentScalarFieldEnum]


  export const PostLikeScalarFieldEnum: {
    id: 'id',
    postId: 'postId',
    userId: 'userId',
    createdAt: 'createdAt'
  };

  export type PostLikeScalarFieldEnum = (typeof PostLikeScalarFieldEnum)[keyof typeof PostLikeScalarFieldEnum]


  export const NotificationScalarFieldEnum: {
    id: 'id',
    type: 'type',
    isRead: 'isRead',
    senderId: 'senderId',
    receiverId: 'receiverId',
    postId: 'postId',
    commentId: 'commentId',
    createdAt: 'createdAt'
  };

  export type NotificationScalarFieldEnum = (typeof NotificationScalarFieldEnum)[keyof typeof NotificationScalarFieldEnum]


  export const CommentLikeScalarFieldEnum: {
    id: 'id',
    commentId: 'commentId',
    userId: 'userId',
    createdAt: 'createdAt'
  };

  export type CommentLikeScalarFieldEnum = (typeof CommentLikeScalarFieldEnum)[keyof typeof CommentLikeScalarFieldEnum]


  export const RepostScalarFieldEnum: {
    id: 'id',
    postId: 'postId',
    userId: 'userId'
  };

  export type RepostScalarFieldEnum = (typeof RepostScalarFieldEnum)[keyof typeof RepostScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'NotificationType'
   */
  export type EnumNotificationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationType'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    role?: StringFilter<"User"> | string
    banned?: BoolFilter<"User"> | boolean
    avatar?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    postViewMode?: StringFilter<"User"> | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    posts?: PostListRelationFilter
    createdTopics?: TopicListRelationFilter
    topics?: TopicListRelationFilter
    comments?: CommentListRelationFilter
    reposts?: RepostListRelationFilter
    postLikes?: PostLikeListRelationFilter
    commentLikes?: CommentLikeListRelationFilter
    sentNotifications?: NotificationListRelationFilter
    receivedNotifications?: NotificationListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    name?: SortOrderInput | SortOrder
    role?: SortOrder
    banned?: SortOrder
    avatar?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    postViewMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    posts?: PostOrderByRelationAggregateInput
    createdTopics?: TopicOrderByRelationAggregateInput
    topics?: TopicOrderByRelationAggregateInput
    comments?: CommentOrderByRelationAggregateInput
    reposts?: RepostOrderByRelationAggregateInput
    postLikes?: PostLikeOrderByRelationAggregateInput
    commentLikes?: CommentLikeOrderByRelationAggregateInput
    sentNotifications?: NotificationOrderByRelationAggregateInput
    receivedNotifications?: NotificationOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    password?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    role?: StringFilter<"User"> | string
    banned?: BoolFilter<"User"> | boolean
    avatar?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    postViewMode?: StringFilter<"User"> | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    posts?: PostListRelationFilter
    createdTopics?: TopicListRelationFilter
    topics?: TopicListRelationFilter
    comments?: CommentListRelationFilter
    reposts?: RepostListRelationFilter
    postLikes?: PostLikeListRelationFilter
    commentLikes?: CommentLikeListRelationFilter
    sentNotifications?: NotificationListRelationFilter
    receivedNotifications?: NotificationListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    name?: SortOrderInput | SortOrder
    role?: SortOrder
    banned?: SortOrder
    avatar?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    postViewMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    role?: StringWithAggregatesFilter<"User"> | string
    banned?: BoolWithAggregatesFilter<"User"> | boolean
    avatar?: StringNullableWithAggregatesFilter<"User"> | string | null
    bio?: StringNullableWithAggregatesFilter<"User"> | string | null
    postViewMode?: StringWithAggregatesFilter<"User"> | string
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type PostWhereInput = {
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    id?: StringFilter<"Post"> | string
    title?: StringNullableFilter<"Post"> | string | null
    content?: StringFilter<"Post"> | string
    authorId?: StringFilter<"Post"> | string
    topicId?: StringNullableFilter<"Post"> | string | null
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
    author?: XOR<UserRelationFilter, UserWhereInput>
    comments?: CommentListRelationFilter
    reposts?: RepostListRelationFilter
    likes?: PostLikeListRelationFilter
    images?: PostImageListRelationFilter
    notifications?: NotificationListRelationFilter
    topic?: XOR<TopicNullableRelationFilter, TopicWhereInput> | null
  }

  export type PostOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrderInput | SortOrder
    content?: SortOrder
    authorId?: SortOrder
    topicId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    author?: UserOrderByWithRelationInput
    comments?: CommentOrderByRelationAggregateInput
    reposts?: RepostOrderByRelationAggregateInput
    likes?: PostLikeOrderByRelationAggregateInput
    images?: PostImageOrderByRelationAggregateInput
    notifications?: NotificationOrderByRelationAggregateInput
    topic?: TopicOrderByWithRelationInput
  }

  export type PostWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    title?: StringNullableFilter<"Post"> | string | null
    content?: StringFilter<"Post"> | string
    authorId?: StringFilter<"Post"> | string
    topicId?: StringNullableFilter<"Post"> | string | null
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
    author?: XOR<UserRelationFilter, UserWhereInput>
    comments?: CommentListRelationFilter
    reposts?: RepostListRelationFilter
    likes?: PostLikeListRelationFilter
    images?: PostImageListRelationFilter
    notifications?: NotificationListRelationFilter
    topic?: XOR<TopicNullableRelationFilter, TopicWhereInput> | null
  }, "id">

  export type PostOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrderInput | SortOrder
    content?: SortOrder
    authorId?: SortOrder
    topicId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PostCountOrderByAggregateInput
    _max?: PostMaxOrderByAggregateInput
    _min?: PostMinOrderByAggregateInput
  }

  export type PostScalarWhereWithAggregatesInput = {
    AND?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    OR?: PostScalarWhereWithAggregatesInput[]
    NOT?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Post"> | string
    title?: StringNullableWithAggregatesFilter<"Post"> | string | null
    content?: StringWithAggregatesFilter<"Post"> | string
    authorId?: StringWithAggregatesFilter<"Post"> | string
    topicId?: StringNullableWithAggregatesFilter<"Post"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
  }

  export type TopicWhereInput = {
    AND?: TopicWhereInput | TopicWhereInput[]
    OR?: TopicWhereInput[]
    NOT?: TopicWhereInput | TopicWhereInput[]
    id?: StringFilter<"Topic"> | string
    name?: StringFilter<"Topic"> | string
    description?: StringNullableFilter<"Topic"> | string | null
    icon?: StringNullableFilter<"Topic"> | string | null
    creatorId?: StringNullableFilter<"Topic"> | string | null
    createdAt?: DateTimeFilter<"Topic"> | Date | string
    updatedAt?: DateTimeFilter<"Topic"> | Date | string
    posts?: PostListRelationFilter
    creator?: XOR<UserNullableRelationFilter, UserWhereInput> | null
    followers?: UserListRelationFilter
  }

  export type TopicOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    creatorId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    posts?: PostOrderByRelationAggregateInput
    creator?: UserOrderByWithRelationInput
    followers?: UserOrderByRelationAggregateInput
  }

  export type TopicWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: TopicWhereInput | TopicWhereInput[]
    OR?: TopicWhereInput[]
    NOT?: TopicWhereInput | TopicWhereInput[]
    description?: StringNullableFilter<"Topic"> | string | null
    icon?: StringNullableFilter<"Topic"> | string | null
    creatorId?: StringNullableFilter<"Topic"> | string | null
    createdAt?: DateTimeFilter<"Topic"> | Date | string
    updatedAt?: DateTimeFilter<"Topic"> | Date | string
    posts?: PostListRelationFilter
    creator?: XOR<UserNullableRelationFilter, UserWhereInput> | null
    followers?: UserListRelationFilter
  }, "id" | "name">

  export type TopicOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    creatorId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TopicCountOrderByAggregateInput
    _max?: TopicMaxOrderByAggregateInput
    _min?: TopicMinOrderByAggregateInput
  }

  export type TopicScalarWhereWithAggregatesInput = {
    AND?: TopicScalarWhereWithAggregatesInput | TopicScalarWhereWithAggregatesInput[]
    OR?: TopicScalarWhereWithAggregatesInput[]
    NOT?: TopicScalarWhereWithAggregatesInput | TopicScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Topic"> | string
    name?: StringWithAggregatesFilter<"Topic"> | string
    description?: StringNullableWithAggregatesFilter<"Topic"> | string | null
    icon?: StringNullableWithAggregatesFilter<"Topic"> | string | null
    creatorId?: StringNullableWithAggregatesFilter<"Topic"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Topic"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Topic"> | Date | string
  }

  export type PostImageWhereInput = {
    AND?: PostImageWhereInput | PostImageWhereInput[]
    OR?: PostImageWhereInput[]
    NOT?: PostImageWhereInput | PostImageWhereInput[]
    id?: StringFilter<"PostImage"> | string
    url?: StringFilter<"PostImage"> | string
    postId?: StringFilter<"PostImage"> | string
    createdAt?: DateTimeFilter<"PostImage"> | Date | string
    post?: XOR<PostRelationFilter, PostWhereInput>
  }

  export type PostImageOrderByWithRelationInput = {
    id?: SortOrder
    url?: SortOrder
    postId?: SortOrder
    createdAt?: SortOrder
    post?: PostOrderByWithRelationInput
  }

  export type PostImageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PostImageWhereInput | PostImageWhereInput[]
    OR?: PostImageWhereInput[]
    NOT?: PostImageWhereInput | PostImageWhereInput[]
    url?: StringFilter<"PostImage"> | string
    postId?: StringFilter<"PostImage"> | string
    createdAt?: DateTimeFilter<"PostImage"> | Date | string
    post?: XOR<PostRelationFilter, PostWhereInput>
  }, "id">

  export type PostImageOrderByWithAggregationInput = {
    id?: SortOrder
    url?: SortOrder
    postId?: SortOrder
    createdAt?: SortOrder
    _count?: PostImageCountOrderByAggregateInput
    _max?: PostImageMaxOrderByAggregateInput
    _min?: PostImageMinOrderByAggregateInput
  }

  export type PostImageScalarWhereWithAggregatesInput = {
    AND?: PostImageScalarWhereWithAggregatesInput | PostImageScalarWhereWithAggregatesInput[]
    OR?: PostImageScalarWhereWithAggregatesInput[]
    NOT?: PostImageScalarWhereWithAggregatesInput | PostImageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PostImage"> | string
    url?: StringWithAggregatesFilter<"PostImage"> | string
    postId?: StringWithAggregatesFilter<"PostImage"> | string
    createdAt?: DateTimeWithAggregatesFilter<"PostImage"> | Date | string
  }

  export type CommentWhereInput = {
    AND?: CommentWhereInput | CommentWhereInput[]
    OR?: CommentWhereInput[]
    NOT?: CommentWhereInput | CommentWhereInput[]
    id?: StringFilter<"Comment"> | string
    content?: StringFilter<"Comment"> | string
    postId?: StringFilter<"Comment"> | string
    authorId?: StringFilter<"Comment"> | string
    parentId?: StringNullableFilter<"Comment"> | string | null
    createdAt?: DateTimeFilter<"Comment"> | Date | string
    post?: XOR<PostRelationFilter, PostWhereInput>
    author?: XOR<UserRelationFilter, UserWhereInput>
    parent?: XOR<CommentNullableRelationFilter, CommentWhereInput> | null
    replies?: CommentListRelationFilter
    likes?: CommentLikeListRelationFilter
  }

  export type CommentOrderByWithRelationInput = {
    id?: SortOrder
    content?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
    parentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    post?: PostOrderByWithRelationInput
    author?: UserOrderByWithRelationInput
    parent?: CommentOrderByWithRelationInput
    replies?: CommentOrderByRelationAggregateInput
    likes?: CommentLikeOrderByRelationAggregateInput
  }

  export type CommentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CommentWhereInput | CommentWhereInput[]
    OR?: CommentWhereInput[]
    NOT?: CommentWhereInput | CommentWhereInput[]
    content?: StringFilter<"Comment"> | string
    postId?: StringFilter<"Comment"> | string
    authorId?: StringFilter<"Comment"> | string
    parentId?: StringNullableFilter<"Comment"> | string | null
    createdAt?: DateTimeFilter<"Comment"> | Date | string
    post?: XOR<PostRelationFilter, PostWhereInput>
    author?: XOR<UserRelationFilter, UserWhereInput>
    parent?: XOR<CommentNullableRelationFilter, CommentWhereInput> | null
    replies?: CommentListRelationFilter
    likes?: CommentLikeListRelationFilter
  }, "id">

  export type CommentOrderByWithAggregationInput = {
    id?: SortOrder
    content?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
    parentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: CommentCountOrderByAggregateInput
    _max?: CommentMaxOrderByAggregateInput
    _min?: CommentMinOrderByAggregateInput
  }

  export type CommentScalarWhereWithAggregatesInput = {
    AND?: CommentScalarWhereWithAggregatesInput | CommentScalarWhereWithAggregatesInput[]
    OR?: CommentScalarWhereWithAggregatesInput[]
    NOT?: CommentScalarWhereWithAggregatesInput | CommentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Comment"> | string
    content?: StringWithAggregatesFilter<"Comment"> | string
    postId?: StringWithAggregatesFilter<"Comment"> | string
    authorId?: StringWithAggregatesFilter<"Comment"> | string
    parentId?: StringNullableWithAggregatesFilter<"Comment"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Comment"> | Date | string
  }

  export type PostLikeWhereInput = {
    AND?: PostLikeWhereInput | PostLikeWhereInput[]
    OR?: PostLikeWhereInput[]
    NOT?: PostLikeWhereInput | PostLikeWhereInput[]
    id?: StringFilter<"PostLike"> | string
    postId?: StringFilter<"PostLike"> | string
    userId?: StringFilter<"PostLike"> | string
    createdAt?: DateTimeFilter<"PostLike"> | Date | string
    post?: XOR<PostRelationFilter, PostWhereInput>
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type PostLikeOrderByWithRelationInput = {
    id?: SortOrder
    postId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    post?: PostOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type PostLikeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    postId_userId?: PostLikePostIdUserIdCompoundUniqueInput
    AND?: PostLikeWhereInput | PostLikeWhereInput[]
    OR?: PostLikeWhereInput[]
    NOT?: PostLikeWhereInput | PostLikeWhereInput[]
    postId?: StringFilter<"PostLike"> | string
    userId?: StringFilter<"PostLike"> | string
    createdAt?: DateTimeFilter<"PostLike"> | Date | string
    post?: XOR<PostRelationFilter, PostWhereInput>
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id" | "postId_userId">

  export type PostLikeOrderByWithAggregationInput = {
    id?: SortOrder
    postId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    _count?: PostLikeCountOrderByAggregateInput
    _max?: PostLikeMaxOrderByAggregateInput
    _min?: PostLikeMinOrderByAggregateInput
  }

  export type PostLikeScalarWhereWithAggregatesInput = {
    AND?: PostLikeScalarWhereWithAggregatesInput | PostLikeScalarWhereWithAggregatesInput[]
    OR?: PostLikeScalarWhereWithAggregatesInput[]
    NOT?: PostLikeScalarWhereWithAggregatesInput | PostLikeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PostLike"> | string
    postId?: StringWithAggregatesFilter<"PostLike"> | string
    userId?: StringWithAggregatesFilter<"PostLike"> | string
    createdAt?: DateTimeWithAggregatesFilter<"PostLike"> | Date | string
  }

  export type NotificationWhereInput = {
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    id?: StringFilter<"Notification"> | string
    type?: EnumNotificationTypeFilter<"Notification"> | $Enums.NotificationType
    isRead?: BoolFilter<"Notification"> | boolean
    senderId?: StringFilter<"Notification"> | string
    receiverId?: StringFilter<"Notification"> | string
    postId?: StringNullableFilter<"Notification"> | string | null
    commentId?: StringNullableFilter<"Notification"> | string | null
    createdAt?: DateTimeFilter<"Notification"> | Date | string
    sender?: XOR<UserRelationFilter, UserWhereInput>
    receiver?: XOR<UserRelationFilter, UserWhereInput>
    post?: XOR<PostNullableRelationFilter, PostWhereInput> | null
  }

  export type NotificationOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    isRead?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    postId?: SortOrderInput | SortOrder
    commentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    sender?: UserOrderByWithRelationInput
    receiver?: UserOrderByWithRelationInput
    post?: PostOrderByWithRelationInput
  }

  export type NotificationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    type?: EnumNotificationTypeFilter<"Notification"> | $Enums.NotificationType
    isRead?: BoolFilter<"Notification"> | boolean
    senderId?: StringFilter<"Notification"> | string
    receiverId?: StringFilter<"Notification"> | string
    postId?: StringNullableFilter<"Notification"> | string | null
    commentId?: StringNullableFilter<"Notification"> | string | null
    createdAt?: DateTimeFilter<"Notification"> | Date | string
    sender?: XOR<UserRelationFilter, UserWhereInput>
    receiver?: XOR<UserRelationFilter, UserWhereInput>
    post?: XOR<PostNullableRelationFilter, PostWhereInput> | null
  }, "id">

  export type NotificationOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    isRead?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    postId?: SortOrderInput | SortOrder
    commentId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: NotificationCountOrderByAggregateInput
    _max?: NotificationMaxOrderByAggregateInput
    _min?: NotificationMinOrderByAggregateInput
  }

  export type NotificationScalarWhereWithAggregatesInput = {
    AND?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    OR?: NotificationScalarWhereWithAggregatesInput[]
    NOT?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Notification"> | string
    type?: EnumNotificationTypeWithAggregatesFilter<"Notification"> | $Enums.NotificationType
    isRead?: BoolWithAggregatesFilter<"Notification"> | boolean
    senderId?: StringWithAggregatesFilter<"Notification"> | string
    receiverId?: StringWithAggregatesFilter<"Notification"> | string
    postId?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    commentId?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Notification"> | Date | string
  }

  export type CommentLikeWhereInput = {
    AND?: CommentLikeWhereInput | CommentLikeWhereInput[]
    OR?: CommentLikeWhereInput[]
    NOT?: CommentLikeWhereInput | CommentLikeWhereInput[]
    id?: StringFilter<"CommentLike"> | string
    commentId?: StringFilter<"CommentLike"> | string
    userId?: StringFilter<"CommentLike"> | string
    createdAt?: DateTimeFilter<"CommentLike"> | Date | string
    comment?: XOR<CommentRelationFilter, CommentWhereInput>
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type CommentLikeOrderByWithRelationInput = {
    id?: SortOrder
    commentId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    comment?: CommentOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type CommentLikeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    commentId_userId?: CommentLikeCommentIdUserIdCompoundUniqueInput
    AND?: CommentLikeWhereInput | CommentLikeWhereInput[]
    OR?: CommentLikeWhereInput[]
    NOT?: CommentLikeWhereInput | CommentLikeWhereInput[]
    commentId?: StringFilter<"CommentLike"> | string
    userId?: StringFilter<"CommentLike"> | string
    createdAt?: DateTimeFilter<"CommentLike"> | Date | string
    comment?: XOR<CommentRelationFilter, CommentWhereInput>
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id" | "commentId_userId">

  export type CommentLikeOrderByWithAggregationInput = {
    id?: SortOrder
    commentId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    _count?: CommentLikeCountOrderByAggregateInput
    _max?: CommentLikeMaxOrderByAggregateInput
    _min?: CommentLikeMinOrderByAggregateInput
  }

  export type CommentLikeScalarWhereWithAggregatesInput = {
    AND?: CommentLikeScalarWhereWithAggregatesInput | CommentLikeScalarWhereWithAggregatesInput[]
    OR?: CommentLikeScalarWhereWithAggregatesInput[]
    NOT?: CommentLikeScalarWhereWithAggregatesInput | CommentLikeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CommentLike"> | string
    commentId?: StringWithAggregatesFilter<"CommentLike"> | string
    userId?: StringWithAggregatesFilter<"CommentLike"> | string
    createdAt?: DateTimeWithAggregatesFilter<"CommentLike"> | Date | string
  }

  export type RepostWhereInput = {
    AND?: RepostWhereInput | RepostWhereInput[]
    OR?: RepostWhereInput[]
    NOT?: RepostWhereInput | RepostWhereInput[]
    id?: StringFilter<"Repost"> | string
    postId?: StringFilter<"Repost"> | string
    userId?: StringFilter<"Repost"> | string
    post?: XOR<PostRelationFilter, PostWhereInput>
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type RepostOrderByWithRelationInput = {
    id?: SortOrder
    postId?: SortOrder
    userId?: SortOrder
    post?: PostOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type RepostWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    postId_userId?: RepostPostIdUserIdCompoundUniqueInput
    AND?: RepostWhereInput | RepostWhereInput[]
    OR?: RepostWhereInput[]
    NOT?: RepostWhereInput | RepostWhereInput[]
    postId?: StringFilter<"Repost"> | string
    userId?: StringFilter<"Repost"> | string
    post?: XOR<PostRelationFilter, PostWhereInput>
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id" | "postId_userId">

  export type RepostOrderByWithAggregationInput = {
    id?: SortOrder
    postId?: SortOrder
    userId?: SortOrder
    _count?: RepostCountOrderByAggregateInput
    _max?: RepostMaxOrderByAggregateInput
    _min?: RepostMinOrderByAggregateInput
  }

  export type RepostScalarWhereWithAggregatesInput = {
    AND?: RepostScalarWhereWithAggregatesInput | RepostScalarWhereWithAggregatesInput[]
    OR?: RepostScalarWhereWithAggregatesInput[]
    NOT?: RepostScalarWhereWithAggregatesInput | RepostScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Repost"> | string
    postId?: StringWithAggregatesFilter<"Repost"> | string
    userId?: StringWithAggregatesFilter<"Repost"> | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicCreateNestedManyWithoutCreatorInput
    topics?: TopicCreateNestedManyWithoutFollowersInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    reposts?: RepostCreateNestedManyWithoutUserInput
    postLikes?: PostLikeCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationCreateNestedManyWithoutReceiverInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicUncheckedCreateNestedManyWithoutCreatorInput
    topics?: TopicUncheckedCreateNestedManyWithoutFollowersInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    reposts?: RepostUncheckedCreateNestedManyWithoutUserInput
    postLikes?: PostLikeUncheckedCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationUncheckedCreateNestedManyWithoutReceiverInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUpdateManyWithoutCreatorNestedInput
    topics?: TopicUpdateManyWithoutFollowersNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUpdateManyWithoutReceiverNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUncheckedUpdateManyWithoutCreatorNestedInput
    topics?: TopicUncheckedUpdateManyWithoutFollowersNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUncheckedUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUncheckedUpdateManyWithoutReceiverNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostCreateInput = {
    id?: string
    title?: string | null
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    author: UserCreateNestedOneWithoutPostsInput
    comments?: CommentCreateNestedManyWithoutPostInput
    reposts?: RepostCreateNestedManyWithoutPostInput
    likes?: PostLikeCreateNestedManyWithoutPostInput
    images?: PostImageCreateNestedManyWithoutPostInput
    notifications?: NotificationCreateNestedManyWithoutPostInput
    topic?: TopicCreateNestedOneWithoutPostsInput
  }

  export type PostUncheckedCreateInput = {
    id?: string
    title?: string | null
    content: string
    authorId: string
    topicId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutPostInput
    reposts?: RepostUncheckedCreateNestedManyWithoutPostInput
    likes?: PostLikeUncheckedCreateNestedManyWithoutPostInput
    images?: PostImageUncheckedCreateNestedManyWithoutPostInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutPostInput
  }

  export type PostUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutPostsNestedInput
    comments?: CommentUpdateManyWithoutPostNestedInput
    reposts?: RepostUpdateManyWithoutPostNestedInput
    likes?: PostLikeUpdateManyWithoutPostNestedInput
    images?: PostImageUpdateManyWithoutPostNestedInput
    notifications?: NotificationUpdateManyWithoutPostNestedInput
    topic?: TopicUpdateOneWithoutPostsNestedInput
  }

  export type PostUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    topicId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutPostNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutPostNestedInput
    likes?: PostLikeUncheckedUpdateManyWithoutPostNestedInput
    images?: PostImageUncheckedUpdateManyWithoutPostNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutPostNestedInput
  }

  export type PostCreateManyInput = {
    id?: string
    title?: string | null
    content: string
    authorId: string
    topicId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    topicId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicCreateInput = {
    id?: string
    name: string
    description?: string | null
    icon?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutTopicInput
    creator?: UserCreateNestedOneWithoutCreatedTopicsInput
    followers?: UserCreateNestedManyWithoutTopicsInput
  }

  export type TopicUncheckedCreateInput = {
    id?: string
    name: string
    description?: string | null
    icon?: string | null
    creatorId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutTopicInput
    followers?: UserUncheckedCreateNestedManyWithoutTopicsInput
  }

  export type TopicUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutTopicNestedInput
    creator?: UserUpdateOneWithoutCreatedTopicsNestedInput
    followers?: UserUpdateManyWithoutTopicsNestedInput
  }

  export type TopicUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    creatorId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutTopicNestedInput
    followers?: UserUncheckedUpdateManyWithoutTopicsNestedInput
  }

  export type TopicCreateManyInput = {
    id?: string
    name: string
    description?: string | null
    icon?: string | null
    creatorId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TopicUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    creatorId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostImageCreateInput = {
    id?: string
    url: string
    createdAt?: Date | string
    post: PostCreateNestedOneWithoutImagesInput
  }

  export type PostImageUncheckedCreateInput = {
    id?: string
    url: string
    postId: string
    createdAt?: Date | string
  }

  export type PostImageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: PostUpdateOneRequiredWithoutImagesNestedInput
  }

  export type PostImageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostImageCreateManyInput = {
    id?: string
    url: string
    postId: string
    createdAt?: Date | string
  }

  export type PostImageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostImageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentCreateInput = {
    id?: string
    content: string
    createdAt?: Date | string
    post: PostCreateNestedOneWithoutCommentsInput
    author: UserCreateNestedOneWithoutCommentsInput
    parent?: CommentCreateNestedOneWithoutRepliesInput
    replies?: CommentCreateNestedManyWithoutParentInput
    likes?: CommentLikeCreateNestedManyWithoutCommentInput
  }

  export type CommentUncheckedCreateInput = {
    id?: string
    content: string
    postId: string
    authorId: string
    parentId?: string | null
    createdAt?: Date | string
    replies?: CommentUncheckedCreateNestedManyWithoutParentInput
    likes?: CommentLikeUncheckedCreateNestedManyWithoutCommentInput
  }

  export type CommentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: PostUpdateOneRequiredWithoutCommentsNestedInput
    author?: UserUpdateOneRequiredWithoutCommentsNestedInput
    parent?: CommentUpdateOneWithoutRepliesNestedInput
    replies?: CommentUpdateManyWithoutParentNestedInput
    likes?: CommentLikeUpdateManyWithoutCommentNestedInput
  }

  export type CommentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: CommentUncheckedUpdateManyWithoutParentNestedInput
    likes?: CommentLikeUncheckedUpdateManyWithoutCommentNestedInput
  }

  export type CommentCreateManyInput = {
    id?: string
    content: string
    postId: string
    authorId: string
    parentId?: string | null
    createdAt?: Date | string
  }

  export type CommentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostLikeCreateInput = {
    id?: string
    createdAt?: Date | string
    post: PostCreateNestedOneWithoutLikesInput
    user: UserCreateNestedOneWithoutPostLikesInput
  }

  export type PostLikeUncheckedCreateInput = {
    id?: string
    postId: string
    userId: string
    createdAt?: Date | string
  }

  export type PostLikeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: PostUpdateOneRequiredWithoutLikesNestedInput
    user?: UserUpdateOneRequiredWithoutPostLikesNestedInput
  }

  export type PostLikeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostLikeCreateManyInput = {
    id?: string
    postId: string
    userId: string
    createdAt?: Date | string
  }

  export type PostLikeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostLikeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationCreateInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    commentId?: string | null
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutSentNotificationsInput
    receiver: UserCreateNestedOneWithoutReceivedNotificationsInput
    post?: PostCreateNestedOneWithoutNotificationsInput
  }

  export type NotificationUncheckedCreateInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    senderId: string
    receiverId: string
    postId?: string | null
    commentId?: string | null
    createdAt?: Date | string
  }

  export type NotificationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutSentNotificationsNestedInput
    receiver?: UserUpdateOneRequiredWithoutReceivedNotificationsNestedInput
    post?: PostUpdateOneWithoutNotificationsNestedInput
  }

  export type NotificationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    senderId?: StringFieldUpdateOperationsInput | string
    receiverId?: StringFieldUpdateOperationsInput | string
    postId?: NullableStringFieldUpdateOperationsInput | string | null
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationCreateManyInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    senderId: string
    receiverId: string
    postId?: string | null
    commentId?: string | null
    createdAt?: Date | string
  }

  export type NotificationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    senderId?: StringFieldUpdateOperationsInput | string
    receiverId?: StringFieldUpdateOperationsInput | string
    postId?: NullableStringFieldUpdateOperationsInput | string | null
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentLikeCreateInput = {
    id?: string
    createdAt?: Date | string
    comment: CommentCreateNestedOneWithoutLikesInput
    user: UserCreateNestedOneWithoutCommentLikesInput
  }

  export type CommentLikeUncheckedCreateInput = {
    id?: string
    commentId: string
    userId: string
    createdAt?: Date | string
  }

  export type CommentLikeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comment?: CommentUpdateOneRequiredWithoutLikesNestedInput
    user?: UserUpdateOneRequiredWithoutCommentLikesNestedInput
  }

  export type CommentLikeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    commentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentLikeCreateManyInput = {
    id?: string
    commentId: string
    userId: string
    createdAt?: Date | string
  }

  export type CommentLikeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentLikeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    commentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RepostCreateInput = {
    id?: string
    post: PostCreateNestedOneWithoutRepostsInput
    user: UserCreateNestedOneWithoutRepostsInput
  }

  export type RepostUncheckedCreateInput = {
    id?: string
    postId: string
    userId: string
  }

  export type RepostUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    post?: PostUpdateOneRequiredWithoutRepostsNestedInput
    user?: UserUpdateOneRequiredWithoutRepostsNestedInput
  }

  export type RepostUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type RepostCreateManyInput = {
    id?: string
    postId: string
    userId: string
  }

  export type RepostUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
  }

  export type RepostUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type PostListRelationFilter = {
    every?: PostWhereInput
    some?: PostWhereInput
    none?: PostWhereInput
  }

  export type TopicListRelationFilter = {
    every?: TopicWhereInput
    some?: TopicWhereInput
    none?: TopicWhereInput
  }

  export type CommentListRelationFilter = {
    every?: CommentWhereInput
    some?: CommentWhereInput
    none?: CommentWhereInput
  }

  export type RepostListRelationFilter = {
    every?: RepostWhereInput
    some?: RepostWhereInput
    none?: RepostWhereInput
  }

  export type PostLikeListRelationFilter = {
    every?: PostLikeWhereInput
    some?: PostLikeWhereInput
    none?: PostLikeWhereInput
  }

  export type CommentLikeListRelationFilter = {
    every?: CommentLikeWhereInput
    some?: CommentLikeWhereInput
    none?: CommentLikeWhereInput
  }

  export type NotificationListRelationFilter = {
    every?: NotificationWhereInput
    some?: NotificationWhereInput
    none?: NotificationWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PostOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TopicOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CommentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RepostOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PostLikeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CommentLikeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type NotificationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    name?: SortOrder
    role?: SortOrder
    banned?: SortOrder
    avatar?: SortOrder
    bio?: SortOrder
    postViewMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    name?: SortOrder
    role?: SortOrder
    banned?: SortOrder
    avatar?: SortOrder
    bio?: SortOrder
    postViewMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    name?: SortOrder
    role?: SortOrder
    banned?: SortOrder
    avatar?: SortOrder
    bio?: SortOrder
    postViewMode?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type PostImageListRelationFilter = {
    every?: PostImageWhereInput
    some?: PostImageWhereInput
    none?: PostImageWhereInput
  }

  export type TopicNullableRelationFilter = {
    is?: TopicWhereInput | null
    isNot?: TopicWhereInput | null
  }

  export type PostImageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PostCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    authorId?: SortOrder
    topicId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    authorId?: SortOrder
    topicId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    authorId?: SortOrder
    topicId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserNullableRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type UserListRelationFilter = {
    every?: UserWhereInput
    some?: UserWhereInput
    none?: UserWhereInput
  }

  export type UserOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TopicCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    icon?: SortOrder
    creatorId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TopicMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    icon?: SortOrder
    creatorId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TopicMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    icon?: SortOrder
    creatorId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostRelationFilter = {
    is?: PostWhereInput
    isNot?: PostWhereInput
  }

  export type PostImageCountOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    postId?: SortOrder
    createdAt?: SortOrder
  }

  export type PostImageMaxOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    postId?: SortOrder
    createdAt?: SortOrder
  }

  export type PostImageMinOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    postId?: SortOrder
    createdAt?: SortOrder
  }

  export type CommentNullableRelationFilter = {
    is?: CommentWhereInput | null
    isNot?: CommentWhereInput | null
  }

  export type CommentCountOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
  }

  export type CommentMaxOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
  }

  export type CommentMinOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
  }

  export type PostLikePostIdUserIdCompoundUniqueInput = {
    postId: string
    userId: string
  }

  export type PostLikeCountOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type PostLikeMaxOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type PostLikeMinOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumNotificationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[]
    notIn?: $Enums.NotificationType[]
    not?: NestedEnumNotificationTypeFilter<$PrismaModel> | $Enums.NotificationType
  }

  export type PostNullableRelationFilter = {
    is?: PostWhereInput | null
    isNot?: PostWhereInput | null
  }

  export type NotificationCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    isRead?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    postId?: SortOrder
    commentId?: SortOrder
    createdAt?: SortOrder
  }

  export type NotificationMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    isRead?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    postId?: SortOrder
    commentId?: SortOrder
    createdAt?: SortOrder
  }

  export type NotificationMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    isRead?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    postId?: SortOrder
    commentId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumNotificationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[]
    notIn?: $Enums.NotificationType[]
    not?: NestedEnumNotificationTypeWithAggregatesFilter<$PrismaModel> | $Enums.NotificationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationTypeFilter<$PrismaModel>
    _max?: NestedEnumNotificationTypeFilter<$PrismaModel>
  }

  export type CommentRelationFilter = {
    is?: CommentWhereInput
    isNot?: CommentWhereInput
  }

  export type CommentLikeCommentIdUserIdCompoundUniqueInput = {
    commentId: string
    userId: string
  }

  export type CommentLikeCountOrderByAggregateInput = {
    id?: SortOrder
    commentId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type CommentLikeMaxOrderByAggregateInput = {
    id?: SortOrder
    commentId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type CommentLikeMinOrderByAggregateInput = {
    id?: SortOrder
    commentId?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type RepostPostIdUserIdCompoundUniqueInput = {
    postId: string
    userId: string
  }

  export type RepostCountOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    userId?: SortOrder
  }

  export type RepostMaxOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    userId?: SortOrder
  }

  export type RepostMinOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    userId?: SortOrder
  }

  export type PostCreateNestedManyWithoutAuthorInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type TopicCreateNestedManyWithoutCreatorInput = {
    create?: XOR<TopicCreateWithoutCreatorInput, TopicUncheckedCreateWithoutCreatorInput> | TopicCreateWithoutCreatorInput[] | TopicUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutCreatorInput | TopicCreateOrConnectWithoutCreatorInput[]
    createMany?: TopicCreateManyCreatorInputEnvelope
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
  }

  export type TopicCreateNestedManyWithoutFollowersInput = {
    create?: XOR<TopicCreateWithoutFollowersInput, TopicUncheckedCreateWithoutFollowersInput> | TopicCreateWithoutFollowersInput[] | TopicUncheckedCreateWithoutFollowersInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutFollowersInput | TopicCreateOrConnectWithoutFollowersInput[]
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
  }

  export type CommentCreateNestedManyWithoutAuthorInput = {
    create?: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput> | CommentCreateWithoutAuthorInput[] | CommentUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutAuthorInput | CommentCreateOrConnectWithoutAuthorInput[]
    createMany?: CommentCreateManyAuthorInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type RepostCreateNestedManyWithoutUserInput = {
    create?: XOR<RepostCreateWithoutUserInput, RepostUncheckedCreateWithoutUserInput> | RepostCreateWithoutUserInput[] | RepostUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RepostCreateOrConnectWithoutUserInput | RepostCreateOrConnectWithoutUserInput[]
    createMany?: RepostCreateManyUserInputEnvelope
    connect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
  }

  export type PostLikeCreateNestedManyWithoutUserInput = {
    create?: XOR<PostLikeCreateWithoutUserInput, PostLikeUncheckedCreateWithoutUserInput> | PostLikeCreateWithoutUserInput[] | PostLikeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PostLikeCreateOrConnectWithoutUserInput | PostLikeCreateOrConnectWithoutUserInput[]
    createMany?: PostLikeCreateManyUserInputEnvelope
    connect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
  }

  export type CommentLikeCreateNestedManyWithoutUserInput = {
    create?: XOR<CommentLikeCreateWithoutUserInput, CommentLikeUncheckedCreateWithoutUserInput> | CommentLikeCreateWithoutUserInput[] | CommentLikeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CommentLikeCreateOrConnectWithoutUserInput | CommentLikeCreateOrConnectWithoutUserInput[]
    createMany?: CommentLikeCreateManyUserInputEnvelope
    connect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
  }

  export type NotificationCreateNestedManyWithoutSenderInput = {
    create?: XOR<NotificationCreateWithoutSenderInput, NotificationUncheckedCreateWithoutSenderInput> | NotificationCreateWithoutSenderInput[] | NotificationUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutSenderInput | NotificationCreateOrConnectWithoutSenderInput[]
    createMany?: NotificationCreateManySenderInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type NotificationCreateNestedManyWithoutReceiverInput = {
    create?: XOR<NotificationCreateWithoutReceiverInput, NotificationUncheckedCreateWithoutReceiverInput> | NotificationCreateWithoutReceiverInput[] | NotificationUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutReceiverInput | NotificationCreateOrConnectWithoutReceiverInput[]
    createMany?: NotificationCreateManyReceiverInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type PostUncheckedCreateNestedManyWithoutAuthorInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type TopicUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: XOR<TopicCreateWithoutCreatorInput, TopicUncheckedCreateWithoutCreatorInput> | TopicCreateWithoutCreatorInput[] | TopicUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutCreatorInput | TopicCreateOrConnectWithoutCreatorInput[]
    createMany?: TopicCreateManyCreatorInputEnvelope
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
  }

  export type TopicUncheckedCreateNestedManyWithoutFollowersInput = {
    create?: XOR<TopicCreateWithoutFollowersInput, TopicUncheckedCreateWithoutFollowersInput> | TopicCreateWithoutFollowersInput[] | TopicUncheckedCreateWithoutFollowersInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutFollowersInput | TopicCreateOrConnectWithoutFollowersInput[]
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
  }

  export type CommentUncheckedCreateNestedManyWithoutAuthorInput = {
    create?: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput> | CommentCreateWithoutAuthorInput[] | CommentUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutAuthorInput | CommentCreateOrConnectWithoutAuthorInput[]
    createMany?: CommentCreateManyAuthorInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type RepostUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<RepostCreateWithoutUserInput, RepostUncheckedCreateWithoutUserInput> | RepostCreateWithoutUserInput[] | RepostUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RepostCreateOrConnectWithoutUserInput | RepostCreateOrConnectWithoutUserInput[]
    createMany?: RepostCreateManyUserInputEnvelope
    connect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
  }

  export type PostLikeUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<PostLikeCreateWithoutUserInput, PostLikeUncheckedCreateWithoutUserInput> | PostLikeCreateWithoutUserInput[] | PostLikeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PostLikeCreateOrConnectWithoutUserInput | PostLikeCreateOrConnectWithoutUserInput[]
    createMany?: PostLikeCreateManyUserInputEnvelope
    connect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
  }

  export type CommentLikeUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<CommentLikeCreateWithoutUserInput, CommentLikeUncheckedCreateWithoutUserInput> | CommentLikeCreateWithoutUserInput[] | CommentLikeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CommentLikeCreateOrConnectWithoutUserInput | CommentLikeCreateOrConnectWithoutUserInput[]
    createMany?: CommentLikeCreateManyUserInputEnvelope
    connect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
  }

  export type NotificationUncheckedCreateNestedManyWithoutSenderInput = {
    create?: XOR<NotificationCreateWithoutSenderInput, NotificationUncheckedCreateWithoutSenderInput> | NotificationCreateWithoutSenderInput[] | NotificationUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutSenderInput | NotificationCreateOrConnectWithoutSenderInput[]
    createMany?: NotificationCreateManySenderInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type NotificationUncheckedCreateNestedManyWithoutReceiverInput = {
    create?: XOR<NotificationCreateWithoutReceiverInput, NotificationUncheckedCreateWithoutReceiverInput> | NotificationCreateWithoutReceiverInput[] | NotificationUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutReceiverInput | NotificationCreateOrConnectWithoutReceiverInput[]
    createMany?: NotificationCreateManyReceiverInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type PostUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutAuthorInput | PostUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutAuthorInput | PostUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: PostUpdateManyWithWhereWithoutAuthorInput | PostUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type TopicUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<TopicCreateWithoutCreatorInput, TopicUncheckedCreateWithoutCreatorInput> | TopicCreateWithoutCreatorInput[] | TopicUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutCreatorInput | TopicCreateOrConnectWithoutCreatorInput[]
    upsert?: TopicUpsertWithWhereUniqueWithoutCreatorInput | TopicUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: TopicCreateManyCreatorInputEnvelope
    set?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    disconnect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    delete?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    update?: TopicUpdateWithWhereUniqueWithoutCreatorInput | TopicUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: TopicUpdateManyWithWhereWithoutCreatorInput | TopicUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: TopicScalarWhereInput | TopicScalarWhereInput[]
  }

  export type TopicUpdateManyWithoutFollowersNestedInput = {
    create?: XOR<TopicCreateWithoutFollowersInput, TopicUncheckedCreateWithoutFollowersInput> | TopicCreateWithoutFollowersInput[] | TopicUncheckedCreateWithoutFollowersInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutFollowersInput | TopicCreateOrConnectWithoutFollowersInput[]
    upsert?: TopicUpsertWithWhereUniqueWithoutFollowersInput | TopicUpsertWithWhereUniqueWithoutFollowersInput[]
    set?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    disconnect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    delete?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    update?: TopicUpdateWithWhereUniqueWithoutFollowersInput | TopicUpdateWithWhereUniqueWithoutFollowersInput[]
    updateMany?: TopicUpdateManyWithWhereWithoutFollowersInput | TopicUpdateManyWithWhereWithoutFollowersInput[]
    deleteMany?: TopicScalarWhereInput | TopicScalarWhereInput[]
  }

  export type CommentUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput> | CommentCreateWithoutAuthorInput[] | CommentUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutAuthorInput | CommentCreateOrConnectWithoutAuthorInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutAuthorInput | CommentUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: CommentCreateManyAuthorInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutAuthorInput | CommentUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutAuthorInput | CommentUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type RepostUpdateManyWithoutUserNestedInput = {
    create?: XOR<RepostCreateWithoutUserInput, RepostUncheckedCreateWithoutUserInput> | RepostCreateWithoutUserInput[] | RepostUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RepostCreateOrConnectWithoutUserInput | RepostCreateOrConnectWithoutUserInput[]
    upsert?: RepostUpsertWithWhereUniqueWithoutUserInput | RepostUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RepostCreateManyUserInputEnvelope
    set?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    disconnect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    delete?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    connect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    update?: RepostUpdateWithWhereUniqueWithoutUserInput | RepostUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RepostUpdateManyWithWhereWithoutUserInput | RepostUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RepostScalarWhereInput | RepostScalarWhereInput[]
  }

  export type PostLikeUpdateManyWithoutUserNestedInput = {
    create?: XOR<PostLikeCreateWithoutUserInput, PostLikeUncheckedCreateWithoutUserInput> | PostLikeCreateWithoutUserInput[] | PostLikeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PostLikeCreateOrConnectWithoutUserInput | PostLikeCreateOrConnectWithoutUserInput[]
    upsert?: PostLikeUpsertWithWhereUniqueWithoutUserInput | PostLikeUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PostLikeCreateManyUserInputEnvelope
    set?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    disconnect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    delete?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    connect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    update?: PostLikeUpdateWithWhereUniqueWithoutUserInput | PostLikeUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PostLikeUpdateManyWithWhereWithoutUserInput | PostLikeUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PostLikeScalarWhereInput | PostLikeScalarWhereInput[]
  }

  export type CommentLikeUpdateManyWithoutUserNestedInput = {
    create?: XOR<CommentLikeCreateWithoutUserInput, CommentLikeUncheckedCreateWithoutUserInput> | CommentLikeCreateWithoutUserInput[] | CommentLikeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CommentLikeCreateOrConnectWithoutUserInput | CommentLikeCreateOrConnectWithoutUserInput[]
    upsert?: CommentLikeUpsertWithWhereUniqueWithoutUserInput | CommentLikeUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CommentLikeCreateManyUserInputEnvelope
    set?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    disconnect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    delete?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    connect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    update?: CommentLikeUpdateWithWhereUniqueWithoutUserInput | CommentLikeUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: CommentLikeUpdateManyWithWhereWithoutUserInput | CommentLikeUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CommentLikeScalarWhereInput | CommentLikeScalarWhereInput[]
  }

  export type NotificationUpdateManyWithoutSenderNestedInput = {
    create?: XOR<NotificationCreateWithoutSenderInput, NotificationUncheckedCreateWithoutSenderInput> | NotificationCreateWithoutSenderInput[] | NotificationUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutSenderInput | NotificationCreateOrConnectWithoutSenderInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutSenderInput | NotificationUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: NotificationCreateManySenderInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutSenderInput | NotificationUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutSenderInput | NotificationUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type NotificationUpdateManyWithoutReceiverNestedInput = {
    create?: XOR<NotificationCreateWithoutReceiverInput, NotificationUncheckedCreateWithoutReceiverInput> | NotificationCreateWithoutReceiverInput[] | NotificationUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutReceiverInput | NotificationCreateOrConnectWithoutReceiverInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutReceiverInput | NotificationUpsertWithWhereUniqueWithoutReceiverInput[]
    createMany?: NotificationCreateManyReceiverInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutReceiverInput | NotificationUpdateWithWhereUniqueWithoutReceiverInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutReceiverInput | NotificationUpdateManyWithWhereWithoutReceiverInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type PostUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutAuthorInput | PostUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutAuthorInput | PostUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: PostUpdateManyWithWhereWithoutAuthorInput | PostUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type TopicUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<TopicCreateWithoutCreatorInput, TopicUncheckedCreateWithoutCreatorInput> | TopicCreateWithoutCreatorInput[] | TopicUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutCreatorInput | TopicCreateOrConnectWithoutCreatorInput[]
    upsert?: TopicUpsertWithWhereUniqueWithoutCreatorInput | TopicUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: TopicCreateManyCreatorInputEnvelope
    set?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    disconnect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    delete?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    update?: TopicUpdateWithWhereUniqueWithoutCreatorInput | TopicUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: TopicUpdateManyWithWhereWithoutCreatorInput | TopicUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: TopicScalarWhereInput | TopicScalarWhereInput[]
  }

  export type TopicUncheckedUpdateManyWithoutFollowersNestedInput = {
    create?: XOR<TopicCreateWithoutFollowersInput, TopicUncheckedCreateWithoutFollowersInput> | TopicCreateWithoutFollowersInput[] | TopicUncheckedCreateWithoutFollowersInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutFollowersInput | TopicCreateOrConnectWithoutFollowersInput[]
    upsert?: TopicUpsertWithWhereUniqueWithoutFollowersInput | TopicUpsertWithWhereUniqueWithoutFollowersInput[]
    set?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    disconnect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    delete?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    update?: TopicUpdateWithWhereUniqueWithoutFollowersInput | TopicUpdateWithWhereUniqueWithoutFollowersInput[]
    updateMany?: TopicUpdateManyWithWhereWithoutFollowersInput | TopicUpdateManyWithWhereWithoutFollowersInput[]
    deleteMany?: TopicScalarWhereInput | TopicScalarWhereInput[]
  }

  export type CommentUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput> | CommentCreateWithoutAuthorInput[] | CommentUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutAuthorInput | CommentCreateOrConnectWithoutAuthorInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutAuthorInput | CommentUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: CommentCreateManyAuthorInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutAuthorInput | CommentUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutAuthorInput | CommentUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type RepostUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<RepostCreateWithoutUserInput, RepostUncheckedCreateWithoutUserInput> | RepostCreateWithoutUserInput[] | RepostUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RepostCreateOrConnectWithoutUserInput | RepostCreateOrConnectWithoutUserInput[]
    upsert?: RepostUpsertWithWhereUniqueWithoutUserInput | RepostUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RepostCreateManyUserInputEnvelope
    set?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    disconnect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    delete?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    connect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    update?: RepostUpdateWithWhereUniqueWithoutUserInput | RepostUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RepostUpdateManyWithWhereWithoutUserInput | RepostUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RepostScalarWhereInput | RepostScalarWhereInput[]
  }

  export type PostLikeUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<PostLikeCreateWithoutUserInput, PostLikeUncheckedCreateWithoutUserInput> | PostLikeCreateWithoutUserInput[] | PostLikeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PostLikeCreateOrConnectWithoutUserInput | PostLikeCreateOrConnectWithoutUserInput[]
    upsert?: PostLikeUpsertWithWhereUniqueWithoutUserInput | PostLikeUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PostLikeCreateManyUserInputEnvelope
    set?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    disconnect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    delete?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    connect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    update?: PostLikeUpdateWithWhereUniqueWithoutUserInput | PostLikeUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PostLikeUpdateManyWithWhereWithoutUserInput | PostLikeUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PostLikeScalarWhereInput | PostLikeScalarWhereInput[]
  }

  export type CommentLikeUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<CommentLikeCreateWithoutUserInput, CommentLikeUncheckedCreateWithoutUserInput> | CommentLikeCreateWithoutUserInput[] | CommentLikeUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CommentLikeCreateOrConnectWithoutUserInput | CommentLikeCreateOrConnectWithoutUserInput[]
    upsert?: CommentLikeUpsertWithWhereUniqueWithoutUserInput | CommentLikeUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CommentLikeCreateManyUserInputEnvelope
    set?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    disconnect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    delete?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    connect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    update?: CommentLikeUpdateWithWhereUniqueWithoutUserInput | CommentLikeUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: CommentLikeUpdateManyWithWhereWithoutUserInput | CommentLikeUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CommentLikeScalarWhereInput | CommentLikeScalarWhereInput[]
  }

  export type NotificationUncheckedUpdateManyWithoutSenderNestedInput = {
    create?: XOR<NotificationCreateWithoutSenderInput, NotificationUncheckedCreateWithoutSenderInput> | NotificationCreateWithoutSenderInput[] | NotificationUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutSenderInput | NotificationCreateOrConnectWithoutSenderInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutSenderInput | NotificationUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: NotificationCreateManySenderInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutSenderInput | NotificationUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutSenderInput | NotificationUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type NotificationUncheckedUpdateManyWithoutReceiverNestedInput = {
    create?: XOR<NotificationCreateWithoutReceiverInput, NotificationUncheckedCreateWithoutReceiverInput> | NotificationCreateWithoutReceiverInput[] | NotificationUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutReceiverInput | NotificationCreateOrConnectWithoutReceiverInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutReceiverInput | NotificationUpsertWithWhereUniqueWithoutReceiverInput[]
    createMany?: NotificationCreateManyReceiverInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutReceiverInput | NotificationUpdateWithWhereUniqueWithoutReceiverInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutReceiverInput | NotificationUpdateManyWithWhereWithoutReceiverInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutPostsInput = {
    create?: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPostsInput
    connect?: UserWhereUniqueInput
  }

  export type CommentCreateNestedManyWithoutPostInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type RepostCreateNestedManyWithoutPostInput = {
    create?: XOR<RepostCreateWithoutPostInput, RepostUncheckedCreateWithoutPostInput> | RepostCreateWithoutPostInput[] | RepostUncheckedCreateWithoutPostInput[]
    connectOrCreate?: RepostCreateOrConnectWithoutPostInput | RepostCreateOrConnectWithoutPostInput[]
    createMany?: RepostCreateManyPostInputEnvelope
    connect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
  }

  export type PostLikeCreateNestedManyWithoutPostInput = {
    create?: XOR<PostLikeCreateWithoutPostInput, PostLikeUncheckedCreateWithoutPostInput> | PostLikeCreateWithoutPostInput[] | PostLikeUncheckedCreateWithoutPostInput[]
    connectOrCreate?: PostLikeCreateOrConnectWithoutPostInput | PostLikeCreateOrConnectWithoutPostInput[]
    createMany?: PostLikeCreateManyPostInputEnvelope
    connect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
  }

  export type PostImageCreateNestedManyWithoutPostInput = {
    create?: XOR<PostImageCreateWithoutPostInput, PostImageUncheckedCreateWithoutPostInput> | PostImageCreateWithoutPostInput[] | PostImageUncheckedCreateWithoutPostInput[]
    connectOrCreate?: PostImageCreateOrConnectWithoutPostInput | PostImageCreateOrConnectWithoutPostInput[]
    createMany?: PostImageCreateManyPostInputEnvelope
    connect?: PostImageWhereUniqueInput | PostImageWhereUniqueInput[]
  }

  export type NotificationCreateNestedManyWithoutPostInput = {
    create?: XOR<NotificationCreateWithoutPostInput, NotificationUncheckedCreateWithoutPostInput> | NotificationCreateWithoutPostInput[] | NotificationUncheckedCreateWithoutPostInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutPostInput | NotificationCreateOrConnectWithoutPostInput[]
    createMany?: NotificationCreateManyPostInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type TopicCreateNestedOneWithoutPostsInput = {
    create?: XOR<TopicCreateWithoutPostsInput, TopicUncheckedCreateWithoutPostsInput>
    connectOrCreate?: TopicCreateOrConnectWithoutPostsInput
    connect?: TopicWhereUniqueInput
  }

  export type CommentUncheckedCreateNestedManyWithoutPostInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type RepostUncheckedCreateNestedManyWithoutPostInput = {
    create?: XOR<RepostCreateWithoutPostInput, RepostUncheckedCreateWithoutPostInput> | RepostCreateWithoutPostInput[] | RepostUncheckedCreateWithoutPostInput[]
    connectOrCreate?: RepostCreateOrConnectWithoutPostInput | RepostCreateOrConnectWithoutPostInput[]
    createMany?: RepostCreateManyPostInputEnvelope
    connect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
  }

  export type PostLikeUncheckedCreateNestedManyWithoutPostInput = {
    create?: XOR<PostLikeCreateWithoutPostInput, PostLikeUncheckedCreateWithoutPostInput> | PostLikeCreateWithoutPostInput[] | PostLikeUncheckedCreateWithoutPostInput[]
    connectOrCreate?: PostLikeCreateOrConnectWithoutPostInput | PostLikeCreateOrConnectWithoutPostInput[]
    createMany?: PostLikeCreateManyPostInputEnvelope
    connect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
  }

  export type PostImageUncheckedCreateNestedManyWithoutPostInput = {
    create?: XOR<PostImageCreateWithoutPostInput, PostImageUncheckedCreateWithoutPostInput> | PostImageCreateWithoutPostInput[] | PostImageUncheckedCreateWithoutPostInput[]
    connectOrCreate?: PostImageCreateOrConnectWithoutPostInput | PostImageCreateOrConnectWithoutPostInput[]
    createMany?: PostImageCreateManyPostInputEnvelope
    connect?: PostImageWhereUniqueInput | PostImageWhereUniqueInput[]
  }

  export type NotificationUncheckedCreateNestedManyWithoutPostInput = {
    create?: XOR<NotificationCreateWithoutPostInput, NotificationUncheckedCreateWithoutPostInput> | NotificationCreateWithoutPostInput[] | NotificationUncheckedCreateWithoutPostInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutPostInput | NotificationCreateOrConnectWithoutPostInput[]
    createMany?: NotificationCreateManyPostInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutPostsNestedInput = {
    create?: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPostsInput
    upsert?: UserUpsertWithoutPostsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPostsInput, UserUpdateWithoutPostsInput>, UserUncheckedUpdateWithoutPostsInput>
  }

  export type CommentUpdateManyWithoutPostNestedInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutPostInput | CommentUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutPostInput | CommentUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutPostInput | CommentUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type RepostUpdateManyWithoutPostNestedInput = {
    create?: XOR<RepostCreateWithoutPostInput, RepostUncheckedCreateWithoutPostInput> | RepostCreateWithoutPostInput[] | RepostUncheckedCreateWithoutPostInput[]
    connectOrCreate?: RepostCreateOrConnectWithoutPostInput | RepostCreateOrConnectWithoutPostInput[]
    upsert?: RepostUpsertWithWhereUniqueWithoutPostInput | RepostUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: RepostCreateManyPostInputEnvelope
    set?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    disconnect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    delete?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    connect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    update?: RepostUpdateWithWhereUniqueWithoutPostInput | RepostUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: RepostUpdateManyWithWhereWithoutPostInput | RepostUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: RepostScalarWhereInput | RepostScalarWhereInput[]
  }

  export type PostLikeUpdateManyWithoutPostNestedInput = {
    create?: XOR<PostLikeCreateWithoutPostInput, PostLikeUncheckedCreateWithoutPostInput> | PostLikeCreateWithoutPostInput[] | PostLikeUncheckedCreateWithoutPostInput[]
    connectOrCreate?: PostLikeCreateOrConnectWithoutPostInput | PostLikeCreateOrConnectWithoutPostInput[]
    upsert?: PostLikeUpsertWithWhereUniqueWithoutPostInput | PostLikeUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: PostLikeCreateManyPostInputEnvelope
    set?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    disconnect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    delete?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    connect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    update?: PostLikeUpdateWithWhereUniqueWithoutPostInput | PostLikeUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: PostLikeUpdateManyWithWhereWithoutPostInput | PostLikeUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: PostLikeScalarWhereInput | PostLikeScalarWhereInput[]
  }

  export type PostImageUpdateManyWithoutPostNestedInput = {
    create?: XOR<PostImageCreateWithoutPostInput, PostImageUncheckedCreateWithoutPostInput> | PostImageCreateWithoutPostInput[] | PostImageUncheckedCreateWithoutPostInput[]
    connectOrCreate?: PostImageCreateOrConnectWithoutPostInput | PostImageCreateOrConnectWithoutPostInput[]
    upsert?: PostImageUpsertWithWhereUniqueWithoutPostInput | PostImageUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: PostImageCreateManyPostInputEnvelope
    set?: PostImageWhereUniqueInput | PostImageWhereUniqueInput[]
    disconnect?: PostImageWhereUniqueInput | PostImageWhereUniqueInput[]
    delete?: PostImageWhereUniqueInput | PostImageWhereUniqueInput[]
    connect?: PostImageWhereUniqueInput | PostImageWhereUniqueInput[]
    update?: PostImageUpdateWithWhereUniqueWithoutPostInput | PostImageUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: PostImageUpdateManyWithWhereWithoutPostInput | PostImageUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: PostImageScalarWhereInput | PostImageScalarWhereInput[]
  }

  export type NotificationUpdateManyWithoutPostNestedInput = {
    create?: XOR<NotificationCreateWithoutPostInput, NotificationUncheckedCreateWithoutPostInput> | NotificationCreateWithoutPostInput[] | NotificationUncheckedCreateWithoutPostInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutPostInput | NotificationCreateOrConnectWithoutPostInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutPostInput | NotificationUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: NotificationCreateManyPostInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutPostInput | NotificationUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutPostInput | NotificationUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type TopicUpdateOneWithoutPostsNestedInput = {
    create?: XOR<TopicCreateWithoutPostsInput, TopicUncheckedCreateWithoutPostsInput>
    connectOrCreate?: TopicCreateOrConnectWithoutPostsInput
    upsert?: TopicUpsertWithoutPostsInput
    disconnect?: TopicWhereInput | boolean
    delete?: TopicWhereInput | boolean
    connect?: TopicWhereUniqueInput
    update?: XOR<XOR<TopicUpdateToOneWithWhereWithoutPostsInput, TopicUpdateWithoutPostsInput>, TopicUncheckedUpdateWithoutPostsInput>
  }

  export type CommentUncheckedUpdateManyWithoutPostNestedInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutPostInput | CommentUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutPostInput | CommentUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutPostInput | CommentUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type RepostUncheckedUpdateManyWithoutPostNestedInput = {
    create?: XOR<RepostCreateWithoutPostInput, RepostUncheckedCreateWithoutPostInput> | RepostCreateWithoutPostInput[] | RepostUncheckedCreateWithoutPostInput[]
    connectOrCreate?: RepostCreateOrConnectWithoutPostInput | RepostCreateOrConnectWithoutPostInput[]
    upsert?: RepostUpsertWithWhereUniqueWithoutPostInput | RepostUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: RepostCreateManyPostInputEnvelope
    set?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    disconnect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    delete?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    connect?: RepostWhereUniqueInput | RepostWhereUniqueInput[]
    update?: RepostUpdateWithWhereUniqueWithoutPostInput | RepostUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: RepostUpdateManyWithWhereWithoutPostInput | RepostUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: RepostScalarWhereInput | RepostScalarWhereInput[]
  }

  export type PostLikeUncheckedUpdateManyWithoutPostNestedInput = {
    create?: XOR<PostLikeCreateWithoutPostInput, PostLikeUncheckedCreateWithoutPostInput> | PostLikeCreateWithoutPostInput[] | PostLikeUncheckedCreateWithoutPostInput[]
    connectOrCreate?: PostLikeCreateOrConnectWithoutPostInput | PostLikeCreateOrConnectWithoutPostInput[]
    upsert?: PostLikeUpsertWithWhereUniqueWithoutPostInput | PostLikeUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: PostLikeCreateManyPostInputEnvelope
    set?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    disconnect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    delete?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    connect?: PostLikeWhereUniqueInput | PostLikeWhereUniqueInput[]
    update?: PostLikeUpdateWithWhereUniqueWithoutPostInput | PostLikeUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: PostLikeUpdateManyWithWhereWithoutPostInput | PostLikeUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: PostLikeScalarWhereInput | PostLikeScalarWhereInput[]
  }

  export type PostImageUncheckedUpdateManyWithoutPostNestedInput = {
    create?: XOR<PostImageCreateWithoutPostInput, PostImageUncheckedCreateWithoutPostInput> | PostImageCreateWithoutPostInput[] | PostImageUncheckedCreateWithoutPostInput[]
    connectOrCreate?: PostImageCreateOrConnectWithoutPostInput | PostImageCreateOrConnectWithoutPostInput[]
    upsert?: PostImageUpsertWithWhereUniqueWithoutPostInput | PostImageUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: PostImageCreateManyPostInputEnvelope
    set?: PostImageWhereUniqueInput | PostImageWhereUniqueInput[]
    disconnect?: PostImageWhereUniqueInput | PostImageWhereUniqueInput[]
    delete?: PostImageWhereUniqueInput | PostImageWhereUniqueInput[]
    connect?: PostImageWhereUniqueInput | PostImageWhereUniqueInput[]
    update?: PostImageUpdateWithWhereUniqueWithoutPostInput | PostImageUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: PostImageUpdateManyWithWhereWithoutPostInput | PostImageUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: PostImageScalarWhereInput | PostImageScalarWhereInput[]
  }

  export type NotificationUncheckedUpdateManyWithoutPostNestedInput = {
    create?: XOR<NotificationCreateWithoutPostInput, NotificationUncheckedCreateWithoutPostInput> | NotificationCreateWithoutPostInput[] | NotificationUncheckedCreateWithoutPostInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutPostInput | NotificationCreateOrConnectWithoutPostInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutPostInput | NotificationUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: NotificationCreateManyPostInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutPostInput | NotificationUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutPostInput | NotificationUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type PostCreateNestedManyWithoutTopicInput = {
    create?: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput> | PostCreateWithoutTopicInput[] | PostUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: PostCreateOrConnectWithoutTopicInput | PostCreateOrConnectWithoutTopicInput[]
    createMany?: PostCreateManyTopicInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type UserCreateNestedOneWithoutCreatedTopicsInput = {
    create?: XOR<UserCreateWithoutCreatedTopicsInput, UserUncheckedCreateWithoutCreatedTopicsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCreatedTopicsInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedManyWithoutTopicsInput = {
    create?: XOR<UserCreateWithoutTopicsInput, UserUncheckedCreateWithoutTopicsInput> | UserCreateWithoutTopicsInput[] | UserUncheckedCreateWithoutTopicsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutTopicsInput | UserCreateOrConnectWithoutTopicsInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type PostUncheckedCreateNestedManyWithoutTopicInput = {
    create?: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput> | PostCreateWithoutTopicInput[] | PostUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: PostCreateOrConnectWithoutTopicInput | PostCreateOrConnectWithoutTopicInput[]
    createMany?: PostCreateManyTopicInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type UserUncheckedCreateNestedManyWithoutTopicsInput = {
    create?: XOR<UserCreateWithoutTopicsInput, UserUncheckedCreateWithoutTopicsInput> | UserCreateWithoutTopicsInput[] | UserUncheckedCreateWithoutTopicsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutTopicsInput | UserCreateOrConnectWithoutTopicsInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type PostUpdateManyWithoutTopicNestedInput = {
    create?: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput> | PostCreateWithoutTopicInput[] | PostUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: PostCreateOrConnectWithoutTopicInput | PostCreateOrConnectWithoutTopicInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutTopicInput | PostUpsertWithWhereUniqueWithoutTopicInput[]
    createMany?: PostCreateManyTopicInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutTopicInput | PostUpdateWithWhereUniqueWithoutTopicInput[]
    updateMany?: PostUpdateManyWithWhereWithoutTopicInput | PostUpdateManyWithWhereWithoutTopicInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type UserUpdateOneWithoutCreatedTopicsNestedInput = {
    create?: XOR<UserCreateWithoutCreatedTopicsInput, UserUncheckedCreateWithoutCreatedTopicsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCreatedTopicsInput
    upsert?: UserUpsertWithoutCreatedTopicsInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCreatedTopicsInput, UserUpdateWithoutCreatedTopicsInput>, UserUncheckedUpdateWithoutCreatedTopicsInput>
  }

  export type UserUpdateManyWithoutTopicsNestedInput = {
    create?: XOR<UserCreateWithoutTopicsInput, UserUncheckedCreateWithoutTopicsInput> | UserCreateWithoutTopicsInput[] | UserUncheckedCreateWithoutTopicsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutTopicsInput | UserCreateOrConnectWithoutTopicsInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutTopicsInput | UserUpsertWithWhereUniqueWithoutTopicsInput[]
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutTopicsInput | UserUpdateWithWhereUniqueWithoutTopicsInput[]
    updateMany?: UserUpdateManyWithWhereWithoutTopicsInput | UserUpdateManyWithWhereWithoutTopicsInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type PostUncheckedUpdateManyWithoutTopicNestedInput = {
    create?: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput> | PostCreateWithoutTopicInput[] | PostUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: PostCreateOrConnectWithoutTopicInput | PostCreateOrConnectWithoutTopicInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutTopicInput | PostUpsertWithWhereUniqueWithoutTopicInput[]
    createMany?: PostCreateManyTopicInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutTopicInput | PostUpdateWithWhereUniqueWithoutTopicInput[]
    updateMany?: PostUpdateManyWithWhereWithoutTopicInput | PostUpdateManyWithWhereWithoutTopicInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type UserUncheckedUpdateManyWithoutTopicsNestedInput = {
    create?: XOR<UserCreateWithoutTopicsInput, UserUncheckedCreateWithoutTopicsInput> | UserCreateWithoutTopicsInput[] | UserUncheckedCreateWithoutTopicsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutTopicsInput | UserCreateOrConnectWithoutTopicsInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutTopicsInput | UserUpsertWithWhereUniqueWithoutTopicsInput[]
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutTopicsInput | UserUpdateWithWhereUniqueWithoutTopicsInput[]
    updateMany?: UserUpdateManyWithWhereWithoutTopicsInput | UserUpdateManyWithWhereWithoutTopicsInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type PostCreateNestedOneWithoutImagesInput = {
    create?: XOR<PostCreateWithoutImagesInput, PostUncheckedCreateWithoutImagesInput>
    connectOrCreate?: PostCreateOrConnectWithoutImagesInput
    connect?: PostWhereUniqueInput
  }

  export type PostUpdateOneRequiredWithoutImagesNestedInput = {
    create?: XOR<PostCreateWithoutImagesInput, PostUncheckedCreateWithoutImagesInput>
    connectOrCreate?: PostCreateOrConnectWithoutImagesInput
    upsert?: PostUpsertWithoutImagesInput
    connect?: PostWhereUniqueInput
    update?: XOR<XOR<PostUpdateToOneWithWhereWithoutImagesInput, PostUpdateWithoutImagesInput>, PostUncheckedUpdateWithoutImagesInput>
  }

  export type PostCreateNestedOneWithoutCommentsInput = {
    create?: XOR<PostCreateWithoutCommentsInput, PostUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: PostCreateOrConnectWithoutCommentsInput
    connect?: PostWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutCommentsInput = {
    create?: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCommentsInput
    connect?: UserWhereUniqueInput
  }

  export type CommentCreateNestedOneWithoutRepliesInput = {
    create?: XOR<CommentCreateWithoutRepliesInput, CommentUncheckedCreateWithoutRepliesInput>
    connectOrCreate?: CommentCreateOrConnectWithoutRepliesInput
    connect?: CommentWhereUniqueInput
  }

  export type CommentCreateNestedManyWithoutParentInput = {
    create?: XOR<CommentCreateWithoutParentInput, CommentUncheckedCreateWithoutParentInput> | CommentCreateWithoutParentInput[] | CommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutParentInput | CommentCreateOrConnectWithoutParentInput[]
    createMany?: CommentCreateManyParentInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type CommentLikeCreateNestedManyWithoutCommentInput = {
    create?: XOR<CommentLikeCreateWithoutCommentInput, CommentLikeUncheckedCreateWithoutCommentInput> | CommentLikeCreateWithoutCommentInput[] | CommentLikeUncheckedCreateWithoutCommentInput[]
    connectOrCreate?: CommentLikeCreateOrConnectWithoutCommentInput | CommentLikeCreateOrConnectWithoutCommentInput[]
    createMany?: CommentLikeCreateManyCommentInputEnvelope
    connect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
  }

  export type CommentUncheckedCreateNestedManyWithoutParentInput = {
    create?: XOR<CommentCreateWithoutParentInput, CommentUncheckedCreateWithoutParentInput> | CommentCreateWithoutParentInput[] | CommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutParentInput | CommentCreateOrConnectWithoutParentInput[]
    createMany?: CommentCreateManyParentInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type CommentLikeUncheckedCreateNestedManyWithoutCommentInput = {
    create?: XOR<CommentLikeCreateWithoutCommentInput, CommentLikeUncheckedCreateWithoutCommentInput> | CommentLikeCreateWithoutCommentInput[] | CommentLikeUncheckedCreateWithoutCommentInput[]
    connectOrCreate?: CommentLikeCreateOrConnectWithoutCommentInput | CommentLikeCreateOrConnectWithoutCommentInput[]
    createMany?: CommentLikeCreateManyCommentInputEnvelope
    connect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
  }

  export type PostUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: XOR<PostCreateWithoutCommentsInput, PostUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: PostCreateOrConnectWithoutCommentsInput
    upsert?: PostUpsertWithoutCommentsInput
    connect?: PostWhereUniqueInput
    update?: XOR<XOR<PostUpdateToOneWithWhereWithoutCommentsInput, PostUpdateWithoutCommentsInput>, PostUncheckedUpdateWithoutCommentsInput>
  }

  export type UserUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCommentsInput
    upsert?: UserUpsertWithoutCommentsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCommentsInput, UserUpdateWithoutCommentsInput>, UserUncheckedUpdateWithoutCommentsInput>
  }

  export type CommentUpdateOneWithoutRepliesNestedInput = {
    create?: XOR<CommentCreateWithoutRepliesInput, CommentUncheckedCreateWithoutRepliesInput>
    connectOrCreate?: CommentCreateOrConnectWithoutRepliesInput
    upsert?: CommentUpsertWithoutRepliesInput
    disconnect?: CommentWhereInput | boolean
    delete?: CommentWhereInput | boolean
    connect?: CommentWhereUniqueInput
    update?: XOR<XOR<CommentUpdateToOneWithWhereWithoutRepliesInput, CommentUpdateWithoutRepliesInput>, CommentUncheckedUpdateWithoutRepliesInput>
  }

  export type CommentUpdateManyWithoutParentNestedInput = {
    create?: XOR<CommentCreateWithoutParentInput, CommentUncheckedCreateWithoutParentInput> | CommentCreateWithoutParentInput[] | CommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutParentInput | CommentCreateOrConnectWithoutParentInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutParentInput | CommentUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: CommentCreateManyParentInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutParentInput | CommentUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutParentInput | CommentUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type CommentLikeUpdateManyWithoutCommentNestedInput = {
    create?: XOR<CommentLikeCreateWithoutCommentInput, CommentLikeUncheckedCreateWithoutCommentInput> | CommentLikeCreateWithoutCommentInput[] | CommentLikeUncheckedCreateWithoutCommentInput[]
    connectOrCreate?: CommentLikeCreateOrConnectWithoutCommentInput | CommentLikeCreateOrConnectWithoutCommentInput[]
    upsert?: CommentLikeUpsertWithWhereUniqueWithoutCommentInput | CommentLikeUpsertWithWhereUniqueWithoutCommentInput[]
    createMany?: CommentLikeCreateManyCommentInputEnvelope
    set?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    disconnect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    delete?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    connect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    update?: CommentLikeUpdateWithWhereUniqueWithoutCommentInput | CommentLikeUpdateWithWhereUniqueWithoutCommentInput[]
    updateMany?: CommentLikeUpdateManyWithWhereWithoutCommentInput | CommentLikeUpdateManyWithWhereWithoutCommentInput[]
    deleteMany?: CommentLikeScalarWhereInput | CommentLikeScalarWhereInput[]
  }

  export type CommentUncheckedUpdateManyWithoutParentNestedInput = {
    create?: XOR<CommentCreateWithoutParentInput, CommentUncheckedCreateWithoutParentInput> | CommentCreateWithoutParentInput[] | CommentUncheckedCreateWithoutParentInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutParentInput | CommentCreateOrConnectWithoutParentInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutParentInput | CommentUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: CommentCreateManyParentInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutParentInput | CommentUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutParentInput | CommentUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type CommentLikeUncheckedUpdateManyWithoutCommentNestedInput = {
    create?: XOR<CommentLikeCreateWithoutCommentInput, CommentLikeUncheckedCreateWithoutCommentInput> | CommentLikeCreateWithoutCommentInput[] | CommentLikeUncheckedCreateWithoutCommentInput[]
    connectOrCreate?: CommentLikeCreateOrConnectWithoutCommentInput | CommentLikeCreateOrConnectWithoutCommentInput[]
    upsert?: CommentLikeUpsertWithWhereUniqueWithoutCommentInput | CommentLikeUpsertWithWhereUniqueWithoutCommentInput[]
    createMany?: CommentLikeCreateManyCommentInputEnvelope
    set?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    disconnect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    delete?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    connect?: CommentLikeWhereUniqueInput | CommentLikeWhereUniqueInput[]
    update?: CommentLikeUpdateWithWhereUniqueWithoutCommentInput | CommentLikeUpdateWithWhereUniqueWithoutCommentInput[]
    updateMany?: CommentLikeUpdateManyWithWhereWithoutCommentInput | CommentLikeUpdateManyWithWhereWithoutCommentInput[]
    deleteMany?: CommentLikeScalarWhereInput | CommentLikeScalarWhereInput[]
  }

  export type PostCreateNestedOneWithoutLikesInput = {
    create?: XOR<PostCreateWithoutLikesInput, PostUncheckedCreateWithoutLikesInput>
    connectOrCreate?: PostCreateOrConnectWithoutLikesInput
    connect?: PostWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutPostLikesInput = {
    create?: XOR<UserCreateWithoutPostLikesInput, UserUncheckedCreateWithoutPostLikesInput>
    connectOrCreate?: UserCreateOrConnectWithoutPostLikesInput
    connect?: UserWhereUniqueInput
  }

  export type PostUpdateOneRequiredWithoutLikesNestedInput = {
    create?: XOR<PostCreateWithoutLikesInput, PostUncheckedCreateWithoutLikesInput>
    connectOrCreate?: PostCreateOrConnectWithoutLikesInput
    upsert?: PostUpsertWithoutLikesInput
    connect?: PostWhereUniqueInput
    update?: XOR<XOR<PostUpdateToOneWithWhereWithoutLikesInput, PostUpdateWithoutLikesInput>, PostUncheckedUpdateWithoutLikesInput>
  }

  export type UserUpdateOneRequiredWithoutPostLikesNestedInput = {
    create?: XOR<UserCreateWithoutPostLikesInput, UserUncheckedCreateWithoutPostLikesInput>
    connectOrCreate?: UserCreateOrConnectWithoutPostLikesInput
    upsert?: UserUpsertWithoutPostLikesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPostLikesInput, UserUpdateWithoutPostLikesInput>, UserUncheckedUpdateWithoutPostLikesInput>
  }

  export type UserCreateNestedOneWithoutSentNotificationsInput = {
    create?: XOR<UserCreateWithoutSentNotificationsInput, UserUncheckedCreateWithoutSentNotificationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentNotificationsInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutReceivedNotificationsInput = {
    create?: XOR<UserCreateWithoutReceivedNotificationsInput, UserUncheckedCreateWithoutReceivedNotificationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutReceivedNotificationsInput
    connect?: UserWhereUniqueInput
  }

  export type PostCreateNestedOneWithoutNotificationsInput = {
    create?: XOR<PostCreateWithoutNotificationsInput, PostUncheckedCreateWithoutNotificationsInput>
    connectOrCreate?: PostCreateOrConnectWithoutNotificationsInput
    connect?: PostWhereUniqueInput
  }

  export type EnumNotificationTypeFieldUpdateOperationsInput = {
    set?: $Enums.NotificationType
  }

  export type UserUpdateOneRequiredWithoutSentNotificationsNestedInput = {
    create?: XOR<UserCreateWithoutSentNotificationsInput, UserUncheckedCreateWithoutSentNotificationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentNotificationsInput
    upsert?: UserUpsertWithoutSentNotificationsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSentNotificationsInput, UserUpdateWithoutSentNotificationsInput>, UserUncheckedUpdateWithoutSentNotificationsInput>
  }

  export type UserUpdateOneRequiredWithoutReceivedNotificationsNestedInput = {
    create?: XOR<UserCreateWithoutReceivedNotificationsInput, UserUncheckedCreateWithoutReceivedNotificationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutReceivedNotificationsInput
    upsert?: UserUpsertWithoutReceivedNotificationsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutReceivedNotificationsInput, UserUpdateWithoutReceivedNotificationsInput>, UserUncheckedUpdateWithoutReceivedNotificationsInput>
  }

  export type PostUpdateOneWithoutNotificationsNestedInput = {
    create?: XOR<PostCreateWithoutNotificationsInput, PostUncheckedCreateWithoutNotificationsInput>
    connectOrCreate?: PostCreateOrConnectWithoutNotificationsInput
    upsert?: PostUpsertWithoutNotificationsInput
    disconnect?: PostWhereInput | boolean
    delete?: PostWhereInput | boolean
    connect?: PostWhereUniqueInput
    update?: XOR<XOR<PostUpdateToOneWithWhereWithoutNotificationsInput, PostUpdateWithoutNotificationsInput>, PostUncheckedUpdateWithoutNotificationsInput>
  }

  export type CommentCreateNestedOneWithoutLikesInput = {
    create?: XOR<CommentCreateWithoutLikesInput, CommentUncheckedCreateWithoutLikesInput>
    connectOrCreate?: CommentCreateOrConnectWithoutLikesInput
    connect?: CommentWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutCommentLikesInput = {
    create?: XOR<UserCreateWithoutCommentLikesInput, UserUncheckedCreateWithoutCommentLikesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCommentLikesInput
    connect?: UserWhereUniqueInput
  }

  export type CommentUpdateOneRequiredWithoutLikesNestedInput = {
    create?: XOR<CommentCreateWithoutLikesInput, CommentUncheckedCreateWithoutLikesInput>
    connectOrCreate?: CommentCreateOrConnectWithoutLikesInput
    upsert?: CommentUpsertWithoutLikesInput
    connect?: CommentWhereUniqueInput
    update?: XOR<XOR<CommentUpdateToOneWithWhereWithoutLikesInput, CommentUpdateWithoutLikesInput>, CommentUncheckedUpdateWithoutLikesInput>
  }

  export type UserUpdateOneRequiredWithoutCommentLikesNestedInput = {
    create?: XOR<UserCreateWithoutCommentLikesInput, UserUncheckedCreateWithoutCommentLikesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCommentLikesInput
    upsert?: UserUpsertWithoutCommentLikesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCommentLikesInput, UserUpdateWithoutCommentLikesInput>, UserUncheckedUpdateWithoutCommentLikesInput>
  }

  export type PostCreateNestedOneWithoutRepostsInput = {
    create?: XOR<PostCreateWithoutRepostsInput, PostUncheckedCreateWithoutRepostsInput>
    connectOrCreate?: PostCreateOrConnectWithoutRepostsInput
    connect?: PostWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutRepostsInput = {
    create?: XOR<UserCreateWithoutRepostsInput, UserUncheckedCreateWithoutRepostsInput>
    connectOrCreate?: UserCreateOrConnectWithoutRepostsInput
    connect?: UserWhereUniqueInput
  }

  export type PostUpdateOneRequiredWithoutRepostsNestedInput = {
    create?: XOR<PostCreateWithoutRepostsInput, PostUncheckedCreateWithoutRepostsInput>
    connectOrCreate?: PostCreateOrConnectWithoutRepostsInput
    upsert?: PostUpsertWithoutRepostsInput
    connect?: PostWhereUniqueInput
    update?: XOR<XOR<PostUpdateToOneWithWhereWithoutRepostsInput, PostUpdateWithoutRepostsInput>, PostUncheckedUpdateWithoutRepostsInput>
  }

  export type UserUpdateOneRequiredWithoutRepostsNestedInput = {
    create?: XOR<UserCreateWithoutRepostsInput, UserUncheckedCreateWithoutRepostsInput>
    connectOrCreate?: UserCreateOrConnectWithoutRepostsInput
    upsert?: UserUpsertWithoutRepostsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRepostsInput, UserUpdateWithoutRepostsInput>, UserUncheckedUpdateWithoutRepostsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumNotificationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[]
    notIn?: $Enums.NotificationType[]
    not?: NestedEnumNotificationTypeFilter<$PrismaModel> | $Enums.NotificationType
  }

  export type NestedEnumNotificationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[]
    notIn?: $Enums.NotificationType[]
    not?: NestedEnumNotificationTypeWithAggregatesFilter<$PrismaModel> | $Enums.NotificationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationTypeFilter<$PrismaModel>
    _max?: NestedEnumNotificationTypeFilter<$PrismaModel>
  }

  export type PostCreateWithoutAuthorInput = {
    id?: string
    title?: string | null
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentCreateNestedManyWithoutPostInput
    reposts?: RepostCreateNestedManyWithoutPostInput
    likes?: PostLikeCreateNestedManyWithoutPostInput
    images?: PostImageCreateNestedManyWithoutPostInput
    notifications?: NotificationCreateNestedManyWithoutPostInput
    topic?: TopicCreateNestedOneWithoutPostsInput
  }

  export type PostUncheckedCreateWithoutAuthorInput = {
    id?: string
    title?: string | null
    content: string
    topicId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutPostInput
    reposts?: RepostUncheckedCreateNestedManyWithoutPostInput
    likes?: PostLikeUncheckedCreateNestedManyWithoutPostInput
    images?: PostImageUncheckedCreateNestedManyWithoutPostInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutPostInput
  }

  export type PostCreateOrConnectWithoutAuthorInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput>
  }

  export type PostCreateManyAuthorInputEnvelope = {
    data: PostCreateManyAuthorInput | PostCreateManyAuthorInput[]
    skipDuplicates?: boolean
  }

  export type TopicCreateWithoutCreatorInput = {
    id?: string
    name: string
    description?: string | null
    icon?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutTopicInput
    followers?: UserCreateNestedManyWithoutTopicsInput
  }

  export type TopicUncheckedCreateWithoutCreatorInput = {
    id?: string
    name: string
    description?: string | null
    icon?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutTopicInput
    followers?: UserUncheckedCreateNestedManyWithoutTopicsInput
  }

  export type TopicCreateOrConnectWithoutCreatorInput = {
    where: TopicWhereUniqueInput
    create: XOR<TopicCreateWithoutCreatorInput, TopicUncheckedCreateWithoutCreatorInput>
  }

  export type TopicCreateManyCreatorInputEnvelope = {
    data: TopicCreateManyCreatorInput | TopicCreateManyCreatorInput[]
    skipDuplicates?: boolean
  }

  export type TopicCreateWithoutFollowersInput = {
    id?: string
    name: string
    description?: string | null
    icon?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutTopicInput
    creator?: UserCreateNestedOneWithoutCreatedTopicsInput
  }

  export type TopicUncheckedCreateWithoutFollowersInput = {
    id?: string
    name: string
    description?: string | null
    icon?: string | null
    creatorId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutTopicInput
  }

  export type TopicCreateOrConnectWithoutFollowersInput = {
    where: TopicWhereUniqueInput
    create: XOR<TopicCreateWithoutFollowersInput, TopicUncheckedCreateWithoutFollowersInput>
  }

  export type CommentCreateWithoutAuthorInput = {
    id?: string
    content: string
    createdAt?: Date | string
    post: PostCreateNestedOneWithoutCommentsInput
    parent?: CommentCreateNestedOneWithoutRepliesInput
    replies?: CommentCreateNestedManyWithoutParentInput
    likes?: CommentLikeCreateNestedManyWithoutCommentInput
  }

  export type CommentUncheckedCreateWithoutAuthorInput = {
    id?: string
    content: string
    postId: string
    parentId?: string | null
    createdAt?: Date | string
    replies?: CommentUncheckedCreateNestedManyWithoutParentInput
    likes?: CommentLikeUncheckedCreateNestedManyWithoutCommentInput
  }

  export type CommentCreateOrConnectWithoutAuthorInput = {
    where: CommentWhereUniqueInput
    create: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput>
  }

  export type CommentCreateManyAuthorInputEnvelope = {
    data: CommentCreateManyAuthorInput | CommentCreateManyAuthorInput[]
    skipDuplicates?: boolean
  }

  export type RepostCreateWithoutUserInput = {
    id?: string
    post: PostCreateNestedOneWithoutRepostsInput
  }

  export type RepostUncheckedCreateWithoutUserInput = {
    id?: string
    postId: string
  }

  export type RepostCreateOrConnectWithoutUserInput = {
    where: RepostWhereUniqueInput
    create: XOR<RepostCreateWithoutUserInput, RepostUncheckedCreateWithoutUserInput>
  }

  export type RepostCreateManyUserInputEnvelope = {
    data: RepostCreateManyUserInput | RepostCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type PostLikeCreateWithoutUserInput = {
    id?: string
    createdAt?: Date | string
    post: PostCreateNestedOneWithoutLikesInput
  }

  export type PostLikeUncheckedCreateWithoutUserInput = {
    id?: string
    postId: string
    createdAt?: Date | string
  }

  export type PostLikeCreateOrConnectWithoutUserInput = {
    where: PostLikeWhereUniqueInput
    create: XOR<PostLikeCreateWithoutUserInput, PostLikeUncheckedCreateWithoutUserInput>
  }

  export type PostLikeCreateManyUserInputEnvelope = {
    data: PostLikeCreateManyUserInput | PostLikeCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type CommentLikeCreateWithoutUserInput = {
    id?: string
    createdAt?: Date | string
    comment: CommentCreateNestedOneWithoutLikesInput
  }

  export type CommentLikeUncheckedCreateWithoutUserInput = {
    id?: string
    commentId: string
    createdAt?: Date | string
  }

  export type CommentLikeCreateOrConnectWithoutUserInput = {
    where: CommentLikeWhereUniqueInput
    create: XOR<CommentLikeCreateWithoutUserInput, CommentLikeUncheckedCreateWithoutUserInput>
  }

  export type CommentLikeCreateManyUserInputEnvelope = {
    data: CommentLikeCreateManyUserInput | CommentLikeCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type NotificationCreateWithoutSenderInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    commentId?: string | null
    createdAt?: Date | string
    receiver: UserCreateNestedOneWithoutReceivedNotificationsInput
    post?: PostCreateNestedOneWithoutNotificationsInput
  }

  export type NotificationUncheckedCreateWithoutSenderInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    receiverId: string
    postId?: string | null
    commentId?: string | null
    createdAt?: Date | string
  }

  export type NotificationCreateOrConnectWithoutSenderInput = {
    where: NotificationWhereUniqueInput
    create: XOR<NotificationCreateWithoutSenderInput, NotificationUncheckedCreateWithoutSenderInput>
  }

  export type NotificationCreateManySenderInputEnvelope = {
    data: NotificationCreateManySenderInput | NotificationCreateManySenderInput[]
    skipDuplicates?: boolean
  }

  export type NotificationCreateWithoutReceiverInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    commentId?: string | null
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutSentNotificationsInput
    post?: PostCreateNestedOneWithoutNotificationsInput
  }

  export type NotificationUncheckedCreateWithoutReceiverInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    senderId: string
    postId?: string | null
    commentId?: string | null
    createdAt?: Date | string
  }

  export type NotificationCreateOrConnectWithoutReceiverInput = {
    where: NotificationWhereUniqueInput
    create: XOR<NotificationCreateWithoutReceiverInput, NotificationUncheckedCreateWithoutReceiverInput>
  }

  export type NotificationCreateManyReceiverInputEnvelope = {
    data: NotificationCreateManyReceiverInput | NotificationCreateManyReceiverInput[]
    skipDuplicates?: boolean
  }

  export type PostUpsertWithWhereUniqueWithoutAuthorInput = {
    where: PostWhereUniqueInput
    update: XOR<PostUpdateWithoutAuthorInput, PostUncheckedUpdateWithoutAuthorInput>
    create: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput>
  }

  export type PostUpdateWithWhereUniqueWithoutAuthorInput = {
    where: PostWhereUniqueInput
    data: XOR<PostUpdateWithoutAuthorInput, PostUncheckedUpdateWithoutAuthorInput>
  }

  export type PostUpdateManyWithWhereWithoutAuthorInput = {
    where: PostScalarWhereInput
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyWithoutAuthorInput>
  }

  export type PostScalarWhereInput = {
    AND?: PostScalarWhereInput | PostScalarWhereInput[]
    OR?: PostScalarWhereInput[]
    NOT?: PostScalarWhereInput | PostScalarWhereInput[]
    id?: StringFilter<"Post"> | string
    title?: StringNullableFilter<"Post"> | string | null
    content?: StringFilter<"Post"> | string
    authorId?: StringFilter<"Post"> | string
    topicId?: StringNullableFilter<"Post"> | string | null
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
  }

  export type TopicUpsertWithWhereUniqueWithoutCreatorInput = {
    where: TopicWhereUniqueInput
    update: XOR<TopicUpdateWithoutCreatorInput, TopicUncheckedUpdateWithoutCreatorInput>
    create: XOR<TopicCreateWithoutCreatorInput, TopicUncheckedCreateWithoutCreatorInput>
  }

  export type TopicUpdateWithWhereUniqueWithoutCreatorInput = {
    where: TopicWhereUniqueInput
    data: XOR<TopicUpdateWithoutCreatorInput, TopicUncheckedUpdateWithoutCreatorInput>
  }

  export type TopicUpdateManyWithWhereWithoutCreatorInput = {
    where: TopicScalarWhereInput
    data: XOR<TopicUpdateManyMutationInput, TopicUncheckedUpdateManyWithoutCreatorInput>
  }

  export type TopicScalarWhereInput = {
    AND?: TopicScalarWhereInput | TopicScalarWhereInput[]
    OR?: TopicScalarWhereInput[]
    NOT?: TopicScalarWhereInput | TopicScalarWhereInput[]
    id?: StringFilter<"Topic"> | string
    name?: StringFilter<"Topic"> | string
    description?: StringNullableFilter<"Topic"> | string | null
    icon?: StringNullableFilter<"Topic"> | string | null
    creatorId?: StringNullableFilter<"Topic"> | string | null
    createdAt?: DateTimeFilter<"Topic"> | Date | string
    updatedAt?: DateTimeFilter<"Topic"> | Date | string
  }

  export type TopicUpsertWithWhereUniqueWithoutFollowersInput = {
    where: TopicWhereUniqueInput
    update: XOR<TopicUpdateWithoutFollowersInput, TopicUncheckedUpdateWithoutFollowersInput>
    create: XOR<TopicCreateWithoutFollowersInput, TopicUncheckedCreateWithoutFollowersInput>
  }

  export type TopicUpdateWithWhereUniqueWithoutFollowersInput = {
    where: TopicWhereUniqueInput
    data: XOR<TopicUpdateWithoutFollowersInput, TopicUncheckedUpdateWithoutFollowersInput>
  }

  export type TopicUpdateManyWithWhereWithoutFollowersInput = {
    where: TopicScalarWhereInput
    data: XOR<TopicUpdateManyMutationInput, TopicUncheckedUpdateManyWithoutFollowersInput>
  }

  export type CommentUpsertWithWhereUniqueWithoutAuthorInput = {
    where: CommentWhereUniqueInput
    update: XOR<CommentUpdateWithoutAuthorInput, CommentUncheckedUpdateWithoutAuthorInput>
    create: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput>
  }

  export type CommentUpdateWithWhereUniqueWithoutAuthorInput = {
    where: CommentWhereUniqueInput
    data: XOR<CommentUpdateWithoutAuthorInput, CommentUncheckedUpdateWithoutAuthorInput>
  }

  export type CommentUpdateManyWithWhereWithoutAuthorInput = {
    where: CommentScalarWhereInput
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyWithoutAuthorInput>
  }

  export type CommentScalarWhereInput = {
    AND?: CommentScalarWhereInput | CommentScalarWhereInput[]
    OR?: CommentScalarWhereInput[]
    NOT?: CommentScalarWhereInput | CommentScalarWhereInput[]
    id?: StringFilter<"Comment"> | string
    content?: StringFilter<"Comment"> | string
    postId?: StringFilter<"Comment"> | string
    authorId?: StringFilter<"Comment"> | string
    parentId?: StringNullableFilter<"Comment"> | string | null
    createdAt?: DateTimeFilter<"Comment"> | Date | string
  }

  export type RepostUpsertWithWhereUniqueWithoutUserInput = {
    where: RepostWhereUniqueInput
    update: XOR<RepostUpdateWithoutUserInput, RepostUncheckedUpdateWithoutUserInput>
    create: XOR<RepostCreateWithoutUserInput, RepostUncheckedCreateWithoutUserInput>
  }

  export type RepostUpdateWithWhereUniqueWithoutUserInput = {
    where: RepostWhereUniqueInput
    data: XOR<RepostUpdateWithoutUserInput, RepostUncheckedUpdateWithoutUserInput>
  }

  export type RepostUpdateManyWithWhereWithoutUserInput = {
    where: RepostScalarWhereInput
    data: XOR<RepostUpdateManyMutationInput, RepostUncheckedUpdateManyWithoutUserInput>
  }

  export type RepostScalarWhereInput = {
    AND?: RepostScalarWhereInput | RepostScalarWhereInput[]
    OR?: RepostScalarWhereInput[]
    NOT?: RepostScalarWhereInput | RepostScalarWhereInput[]
    id?: StringFilter<"Repost"> | string
    postId?: StringFilter<"Repost"> | string
    userId?: StringFilter<"Repost"> | string
  }

  export type PostLikeUpsertWithWhereUniqueWithoutUserInput = {
    where: PostLikeWhereUniqueInput
    update: XOR<PostLikeUpdateWithoutUserInput, PostLikeUncheckedUpdateWithoutUserInput>
    create: XOR<PostLikeCreateWithoutUserInput, PostLikeUncheckedCreateWithoutUserInput>
  }

  export type PostLikeUpdateWithWhereUniqueWithoutUserInput = {
    where: PostLikeWhereUniqueInput
    data: XOR<PostLikeUpdateWithoutUserInput, PostLikeUncheckedUpdateWithoutUserInput>
  }

  export type PostLikeUpdateManyWithWhereWithoutUserInput = {
    where: PostLikeScalarWhereInput
    data: XOR<PostLikeUpdateManyMutationInput, PostLikeUncheckedUpdateManyWithoutUserInput>
  }

  export type PostLikeScalarWhereInput = {
    AND?: PostLikeScalarWhereInput | PostLikeScalarWhereInput[]
    OR?: PostLikeScalarWhereInput[]
    NOT?: PostLikeScalarWhereInput | PostLikeScalarWhereInput[]
    id?: StringFilter<"PostLike"> | string
    postId?: StringFilter<"PostLike"> | string
    userId?: StringFilter<"PostLike"> | string
    createdAt?: DateTimeFilter<"PostLike"> | Date | string
  }

  export type CommentLikeUpsertWithWhereUniqueWithoutUserInput = {
    where: CommentLikeWhereUniqueInput
    update: XOR<CommentLikeUpdateWithoutUserInput, CommentLikeUncheckedUpdateWithoutUserInput>
    create: XOR<CommentLikeCreateWithoutUserInput, CommentLikeUncheckedCreateWithoutUserInput>
  }

  export type CommentLikeUpdateWithWhereUniqueWithoutUserInput = {
    where: CommentLikeWhereUniqueInput
    data: XOR<CommentLikeUpdateWithoutUserInput, CommentLikeUncheckedUpdateWithoutUserInput>
  }

  export type CommentLikeUpdateManyWithWhereWithoutUserInput = {
    where: CommentLikeScalarWhereInput
    data: XOR<CommentLikeUpdateManyMutationInput, CommentLikeUncheckedUpdateManyWithoutUserInput>
  }

  export type CommentLikeScalarWhereInput = {
    AND?: CommentLikeScalarWhereInput | CommentLikeScalarWhereInput[]
    OR?: CommentLikeScalarWhereInput[]
    NOT?: CommentLikeScalarWhereInput | CommentLikeScalarWhereInput[]
    id?: StringFilter<"CommentLike"> | string
    commentId?: StringFilter<"CommentLike"> | string
    userId?: StringFilter<"CommentLike"> | string
    createdAt?: DateTimeFilter<"CommentLike"> | Date | string
  }

  export type NotificationUpsertWithWhereUniqueWithoutSenderInput = {
    where: NotificationWhereUniqueInput
    update: XOR<NotificationUpdateWithoutSenderInput, NotificationUncheckedUpdateWithoutSenderInput>
    create: XOR<NotificationCreateWithoutSenderInput, NotificationUncheckedCreateWithoutSenderInput>
  }

  export type NotificationUpdateWithWhereUniqueWithoutSenderInput = {
    where: NotificationWhereUniqueInput
    data: XOR<NotificationUpdateWithoutSenderInput, NotificationUncheckedUpdateWithoutSenderInput>
  }

  export type NotificationUpdateManyWithWhereWithoutSenderInput = {
    where: NotificationScalarWhereInput
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyWithoutSenderInput>
  }

  export type NotificationScalarWhereInput = {
    AND?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
    OR?: NotificationScalarWhereInput[]
    NOT?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
    id?: StringFilter<"Notification"> | string
    type?: EnumNotificationTypeFilter<"Notification"> | $Enums.NotificationType
    isRead?: BoolFilter<"Notification"> | boolean
    senderId?: StringFilter<"Notification"> | string
    receiverId?: StringFilter<"Notification"> | string
    postId?: StringNullableFilter<"Notification"> | string | null
    commentId?: StringNullableFilter<"Notification"> | string | null
    createdAt?: DateTimeFilter<"Notification"> | Date | string
  }

  export type NotificationUpsertWithWhereUniqueWithoutReceiverInput = {
    where: NotificationWhereUniqueInput
    update: XOR<NotificationUpdateWithoutReceiverInput, NotificationUncheckedUpdateWithoutReceiverInput>
    create: XOR<NotificationCreateWithoutReceiverInput, NotificationUncheckedCreateWithoutReceiverInput>
  }

  export type NotificationUpdateWithWhereUniqueWithoutReceiverInput = {
    where: NotificationWhereUniqueInput
    data: XOR<NotificationUpdateWithoutReceiverInput, NotificationUncheckedUpdateWithoutReceiverInput>
  }

  export type NotificationUpdateManyWithWhereWithoutReceiverInput = {
    where: NotificationScalarWhereInput
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyWithoutReceiverInput>
  }

  export type UserCreateWithoutPostsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdTopics?: TopicCreateNestedManyWithoutCreatorInput
    topics?: TopicCreateNestedManyWithoutFollowersInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    reposts?: RepostCreateNestedManyWithoutUserInput
    postLikes?: PostLikeCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationCreateNestedManyWithoutReceiverInput
  }

  export type UserUncheckedCreateWithoutPostsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    createdTopics?: TopicUncheckedCreateNestedManyWithoutCreatorInput
    topics?: TopicUncheckedCreateNestedManyWithoutFollowersInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    reposts?: RepostUncheckedCreateNestedManyWithoutUserInput
    postLikes?: PostLikeUncheckedCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationUncheckedCreateNestedManyWithoutReceiverInput
  }

  export type UserCreateOrConnectWithoutPostsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
  }

  export type CommentCreateWithoutPostInput = {
    id?: string
    content: string
    createdAt?: Date | string
    author: UserCreateNestedOneWithoutCommentsInput
    parent?: CommentCreateNestedOneWithoutRepliesInput
    replies?: CommentCreateNestedManyWithoutParentInput
    likes?: CommentLikeCreateNestedManyWithoutCommentInput
  }

  export type CommentUncheckedCreateWithoutPostInput = {
    id?: string
    content: string
    authorId: string
    parentId?: string | null
    createdAt?: Date | string
    replies?: CommentUncheckedCreateNestedManyWithoutParentInput
    likes?: CommentLikeUncheckedCreateNestedManyWithoutCommentInput
  }

  export type CommentCreateOrConnectWithoutPostInput = {
    where: CommentWhereUniqueInput
    create: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput>
  }

  export type CommentCreateManyPostInputEnvelope = {
    data: CommentCreateManyPostInput | CommentCreateManyPostInput[]
    skipDuplicates?: boolean
  }

  export type RepostCreateWithoutPostInput = {
    id?: string
    user: UserCreateNestedOneWithoutRepostsInput
  }

  export type RepostUncheckedCreateWithoutPostInput = {
    id?: string
    userId: string
  }

  export type RepostCreateOrConnectWithoutPostInput = {
    where: RepostWhereUniqueInput
    create: XOR<RepostCreateWithoutPostInput, RepostUncheckedCreateWithoutPostInput>
  }

  export type RepostCreateManyPostInputEnvelope = {
    data: RepostCreateManyPostInput | RepostCreateManyPostInput[]
    skipDuplicates?: boolean
  }

  export type PostLikeCreateWithoutPostInput = {
    id?: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutPostLikesInput
  }

  export type PostLikeUncheckedCreateWithoutPostInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type PostLikeCreateOrConnectWithoutPostInput = {
    where: PostLikeWhereUniqueInput
    create: XOR<PostLikeCreateWithoutPostInput, PostLikeUncheckedCreateWithoutPostInput>
  }

  export type PostLikeCreateManyPostInputEnvelope = {
    data: PostLikeCreateManyPostInput | PostLikeCreateManyPostInput[]
    skipDuplicates?: boolean
  }

  export type PostImageCreateWithoutPostInput = {
    id?: string
    url: string
    createdAt?: Date | string
  }

  export type PostImageUncheckedCreateWithoutPostInput = {
    id?: string
    url: string
    createdAt?: Date | string
  }

  export type PostImageCreateOrConnectWithoutPostInput = {
    where: PostImageWhereUniqueInput
    create: XOR<PostImageCreateWithoutPostInput, PostImageUncheckedCreateWithoutPostInput>
  }

  export type PostImageCreateManyPostInputEnvelope = {
    data: PostImageCreateManyPostInput | PostImageCreateManyPostInput[]
    skipDuplicates?: boolean
  }

  export type NotificationCreateWithoutPostInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    commentId?: string | null
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutSentNotificationsInput
    receiver: UserCreateNestedOneWithoutReceivedNotificationsInput
  }

  export type NotificationUncheckedCreateWithoutPostInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    senderId: string
    receiverId: string
    commentId?: string | null
    createdAt?: Date | string
  }

  export type NotificationCreateOrConnectWithoutPostInput = {
    where: NotificationWhereUniqueInput
    create: XOR<NotificationCreateWithoutPostInput, NotificationUncheckedCreateWithoutPostInput>
  }

  export type NotificationCreateManyPostInputEnvelope = {
    data: NotificationCreateManyPostInput | NotificationCreateManyPostInput[]
    skipDuplicates?: boolean
  }

  export type TopicCreateWithoutPostsInput = {
    id?: string
    name: string
    description?: string | null
    icon?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creator?: UserCreateNestedOneWithoutCreatedTopicsInput
    followers?: UserCreateNestedManyWithoutTopicsInput
  }

  export type TopicUncheckedCreateWithoutPostsInput = {
    id?: string
    name: string
    description?: string | null
    icon?: string | null
    creatorId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    followers?: UserUncheckedCreateNestedManyWithoutTopicsInput
  }

  export type TopicCreateOrConnectWithoutPostsInput = {
    where: TopicWhereUniqueInput
    create: XOR<TopicCreateWithoutPostsInput, TopicUncheckedCreateWithoutPostsInput>
  }

  export type UserUpsertWithoutPostsInput = {
    update: XOR<UserUpdateWithoutPostsInput, UserUncheckedUpdateWithoutPostsInput>
    create: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPostsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPostsInput, UserUncheckedUpdateWithoutPostsInput>
  }

  export type UserUpdateWithoutPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdTopics?: TopicUpdateManyWithoutCreatorNestedInput
    topics?: TopicUpdateManyWithoutFollowersNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUpdateManyWithoutReceiverNestedInput
  }

  export type UserUncheckedUpdateWithoutPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdTopics?: TopicUncheckedUpdateManyWithoutCreatorNestedInput
    topics?: TopicUncheckedUpdateManyWithoutFollowersNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUncheckedUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUncheckedUpdateManyWithoutReceiverNestedInput
  }

  export type CommentUpsertWithWhereUniqueWithoutPostInput = {
    where: CommentWhereUniqueInput
    update: XOR<CommentUpdateWithoutPostInput, CommentUncheckedUpdateWithoutPostInput>
    create: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput>
  }

  export type CommentUpdateWithWhereUniqueWithoutPostInput = {
    where: CommentWhereUniqueInput
    data: XOR<CommentUpdateWithoutPostInput, CommentUncheckedUpdateWithoutPostInput>
  }

  export type CommentUpdateManyWithWhereWithoutPostInput = {
    where: CommentScalarWhereInput
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyWithoutPostInput>
  }

  export type RepostUpsertWithWhereUniqueWithoutPostInput = {
    where: RepostWhereUniqueInput
    update: XOR<RepostUpdateWithoutPostInput, RepostUncheckedUpdateWithoutPostInput>
    create: XOR<RepostCreateWithoutPostInput, RepostUncheckedCreateWithoutPostInput>
  }

  export type RepostUpdateWithWhereUniqueWithoutPostInput = {
    where: RepostWhereUniqueInput
    data: XOR<RepostUpdateWithoutPostInput, RepostUncheckedUpdateWithoutPostInput>
  }

  export type RepostUpdateManyWithWhereWithoutPostInput = {
    where: RepostScalarWhereInput
    data: XOR<RepostUpdateManyMutationInput, RepostUncheckedUpdateManyWithoutPostInput>
  }

  export type PostLikeUpsertWithWhereUniqueWithoutPostInput = {
    where: PostLikeWhereUniqueInput
    update: XOR<PostLikeUpdateWithoutPostInput, PostLikeUncheckedUpdateWithoutPostInput>
    create: XOR<PostLikeCreateWithoutPostInput, PostLikeUncheckedCreateWithoutPostInput>
  }

  export type PostLikeUpdateWithWhereUniqueWithoutPostInput = {
    where: PostLikeWhereUniqueInput
    data: XOR<PostLikeUpdateWithoutPostInput, PostLikeUncheckedUpdateWithoutPostInput>
  }

  export type PostLikeUpdateManyWithWhereWithoutPostInput = {
    where: PostLikeScalarWhereInput
    data: XOR<PostLikeUpdateManyMutationInput, PostLikeUncheckedUpdateManyWithoutPostInput>
  }

  export type PostImageUpsertWithWhereUniqueWithoutPostInput = {
    where: PostImageWhereUniqueInput
    update: XOR<PostImageUpdateWithoutPostInput, PostImageUncheckedUpdateWithoutPostInput>
    create: XOR<PostImageCreateWithoutPostInput, PostImageUncheckedCreateWithoutPostInput>
  }

  export type PostImageUpdateWithWhereUniqueWithoutPostInput = {
    where: PostImageWhereUniqueInput
    data: XOR<PostImageUpdateWithoutPostInput, PostImageUncheckedUpdateWithoutPostInput>
  }

  export type PostImageUpdateManyWithWhereWithoutPostInput = {
    where: PostImageScalarWhereInput
    data: XOR<PostImageUpdateManyMutationInput, PostImageUncheckedUpdateManyWithoutPostInput>
  }

  export type PostImageScalarWhereInput = {
    AND?: PostImageScalarWhereInput | PostImageScalarWhereInput[]
    OR?: PostImageScalarWhereInput[]
    NOT?: PostImageScalarWhereInput | PostImageScalarWhereInput[]
    id?: StringFilter<"PostImage"> | string
    url?: StringFilter<"PostImage"> | string
    postId?: StringFilter<"PostImage"> | string
    createdAt?: DateTimeFilter<"PostImage"> | Date | string
  }

  export type NotificationUpsertWithWhereUniqueWithoutPostInput = {
    where: NotificationWhereUniqueInput
    update: XOR<NotificationUpdateWithoutPostInput, NotificationUncheckedUpdateWithoutPostInput>
    create: XOR<NotificationCreateWithoutPostInput, NotificationUncheckedCreateWithoutPostInput>
  }

  export type NotificationUpdateWithWhereUniqueWithoutPostInput = {
    where: NotificationWhereUniqueInput
    data: XOR<NotificationUpdateWithoutPostInput, NotificationUncheckedUpdateWithoutPostInput>
  }

  export type NotificationUpdateManyWithWhereWithoutPostInput = {
    where: NotificationScalarWhereInput
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyWithoutPostInput>
  }

  export type TopicUpsertWithoutPostsInput = {
    update: XOR<TopicUpdateWithoutPostsInput, TopicUncheckedUpdateWithoutPostsInput>
    create: XOR<TopicCreateWithoutPostsInput, TopicUncheckedCreateWithoutPostsInput>
    where?: TopicWhereInput
  }

  export type TopicUpdateToOneWithWhereWithoutPostsInput = {
    where?: TopicWhereInput
    data: XOR<TopicUpdateWithoutPostsInput, TopicUncheckedUpdateWithoutPostsInput>
  }

  export type TopicUpdateWithoutPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: UserUpdateOneWithoutCreatedTopicsNestedInput
    followers?: UserUpdateManyWithoutTopicsNestedInput
  }

  export type TopicUncheckedUpdateWithoutPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    creatorId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    followers?: UserUncheckedUpdateManyWithoutTopicsNestedInput
  }

  export type PostCreateWithoutTopicInput = {
    id?: string
    title?: string | null
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    author: UserCreateNestedOneWithoutPostsInput
    comments?: CommentCreateNestedManyWithoutPostInput
    reposts?: RepostCreateNestedManyWithoutPostInput
    likes?: PostLikeCreateNestedManyWithoutPostInput
    images?: PostImageCreateNestedManyWithoutPostInput
    notifications?: NotificationCreateNestedManyWithoutPostInput
  }

  export type PostUncheckedCreateWithoutTopicInput = {
    id?: string
    title?: string | null
    content: string
    authorId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutPostInput
    reposts?: RepostUncheckedCreateNestedManyWithoutPostInput
    likes?: PostLikeUncheckedCreateNestedManyWithoutPostInput
    images?: PostImageUncheckedCreateNestedManyWithoutPostInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutPostInput
  }

  export type PostCreateOrConnectWithoutTopicInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput>
  }

  export type PostCreateManyTopicInputEnvelope = {
    data: PostCreateManyTopicInput | PostCreateManyTopicInput[]
    skipDuplicates?: boolean
  }

  export type UserCreateWithoutCreatedTopicsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    topics?: TopicCreateNestedManyWithoutFollowersInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    reposts?: RepostCreateNestedManyWithoutUserInput
    postLikes?: PostLikeCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationCreateNestedManyWithoutReceiverInput
  }

  export type UserUncheckedCreateWithoutCreatedTopicsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    topics?: TopicUncheckedCreateNestedManyWithoutFollowersInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    reposts?: RepostUncheckedCreateNestedManyWithoutUserInput
    postLikes?: PostLikeUncheckedCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationUncheckedCreateNestedManyWithoutReceiverInput
  }

  export type UserCreateOrConnectWithoutCreatedTopicsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCreatedTopicsInput, UserUncheckedCreateWithoutCreatedTopicsInput>
  }

  export type UserCreateWithoutTopicsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicCreateNestedManyWithoutCreatorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    reposts?: RepostCreateNestedManyWithoutUserInput
    postLikes?: PostLikeCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationCreateNestedManyWithoutReceiverInput
  }

  export type UserUncheckedCreateWithoutTopicsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicUncheckedCreateNestedManyWithoutCreatorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    reposts?: RepostUncheckedCreateNestedManyWithoutUserInput
    postLikes?: PostLikeUncheckedCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationUncheckedCreateNestedManyWithoutReceiverInput
  }

  export type UserCreateOrConnectWithoutTopicsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutTopicsInput, UserUncheckedCreateWithoutTopicsInput>
  }

  export type PostUpsertWithWhereUniqueWithoutTopicInput = {
    where: PostWhereUniqueInput
    update: XOR<PostUpdateWithoutTopicInput, PostUncheckedUpdateWithoutTopicInput>
    create: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput>
  }

  export type PostUpdateWithWhereUniqueWithoutTopicInput = {
    where: PostWhereUniqueInput
    data: XOR<PostUpdateWithoutTopicInput, PostUncheckedUpdateWithoutTopicInput>
  }

  export type PostUpdateManyWithWhereWithoutTopicInput = {
    where: PostScalarWhereInput
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyWithoutTopicInput>
  }

  export type UserUpsertWithoutCreatedTopicsInput = {
    update: XOR<UserUpdateWithoutCreatedTopicsInput, UserUncheckedUpdateWithoutCreatedTopicsInput>
    create: XOR<UserCreateWithoutCreatedTopicsInput, UserUncheckedCreateWithoutCreatedTopicsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCreatedTopicsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCreatedTopicsInput, UserUncheckedUpdateWithoutCreatedTopicsInput>
  }

  export type UserUpdateWithoutCreatedTopicsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    topics?: TopicUpdateManyWithoutFollowersNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUpdateManyWithoutReceiverNestedInput
  }

  export type UserUncheckedUpdateWithoutCreatedTopicsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    topics?: TopicUncheckedUpdateManyWithoutFollowersNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUncheckedUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUncheckedUpdateManyWithoutReceiverNestedInput
  }

  export type UserUpsertWithWhereUniqueWithoutTopicsInput = {
    where: UserWhereUniqueInput
    update: XOR<UserUpdateWithoutTopicsInput, UserUncheckedUpdateWithoutTopicsInput>
    create: XOR<UserCreateWithoutTopicsInput, UserUncheckedCreateWithoutTopicsInput>
  }

  export type UserUpdateWithWhereUniqueWithoutTopicsInput = {
    where: UserWhereUniqueInput
    data: XOR<UserUpdateWithoutTopicsInput, UserUncheckedUpdateWithoutTopicsInput>
  }

  export type UserUpdateManyWithWhereWithoutTopicsInput = {
    where: UserScalarWhereInput
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyWithoutTopicsInput>
  }

  export type UserScalarWhereInput = {
    AND?: UserScalarWhereInput | UserScalarWhereInput[]
    OR?: UserScalarWhereInput[]
    NOT?: UserScalarWhereInput | UserScalarWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    role?: StringFilter<"User"> | string
    banned?: BoolFilter<"User"> | boolean
    avatar?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    postViewMode?: StringFilter<"User"> | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
  }

  export type PostCreateWithoutImagesInput = {
    id?: string
    title?: string | null
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    author: UserCreateNestedOneWithoutPostsInput
    comments?: CommentCreateNestedManyWithoutPostInput
    reposts?: RepostCreateNestedManyWithoutPostInput
    likes?: PostLikeCreateNestedManyWithoutPostInput
    notifications?: NotificationCreateNestedManyWithoutPostInput
    topic?: TopicCreateNestedOneWithoutPostsInput
  }

  export type PostUncheckedCreateWithoutImagesInput = {
    id?: string
    title?: string | null
    content: string
    authorId: string
    topicId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutPostInput
    reposts?: RepostUncheckedCreateNestedManyWithoutPostInput
    likes?: PostLikeUncheckedCreateNestedManyWithoutPostInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutPostInput
  }

  export type PostCreateOrConnectWithoutImagesInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutImagesInput, PostUncheckedCreateWithoutImagesInput>
  }

  export type PostUpsertWithoutImagesInput = {
    update: XOR<PostUpdateWithoutImagesInput, PostUncheckedUpdateWithoutImagesInput>
    create: XOR<PostCreateWithoutImagesInput, PostUncheckedCreateWithoutImagesInput>
    where?: PostWhereInput
  }

  export type PostUpdateToOneWithWhereWithoutImagesInput = {
    where?: PostWhereInput
    data: XOR<PostUpdateWithoutImagesInput, PostUncheckedUpdateWithoutImagesInput>
  }

  export type PostUpdateWithoutImagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutPostsNestedInput
    comments?: CommentUpdateManyWithoutPostNestedInput
    reposts?: RepostUpdateManyWithoutPostNestedInput
    likes?: PostLikeUpdateManyWithoutPostNestedInput
    notifications?: NotificationUpdateManyWithoutPostNestedInput
    topic?: TopicUpdateOneWithoutPostsNestedInput
  }

  export type PostUncheckedUpdateWithoutImagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    topicId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutPostNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutPostNestedInput
    likes?: PostLikeUncheckedUpdateManyWithoutPostNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutPostNestedInput
  }

  export type PostCreateWithoutCommentsInput = {
    id?: string
    title?: string | null
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    author: UserCreateNestedOneWithoutPostsInput
    reposts?: RepostCreateNestedManyWithoutPostInput
    likes?: PostLikeCreateNestedManyWithoutPostInput
    images?: PostImageCreateNestedManyWithoutPostInput
    notifications?: NotificationCreateNestedManyWithoutPostInput
    topic?: TopicCreateNestedOneWithoutPostsInput
  }

  export type PostUncheckedCreateWithoutCommentsInput = {
    id?: string
    title?: string | null
    content: string
    authorId: string
    topicId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    reposts?: RepostUncheckedCreateNestedManyWithoutPostInput
    likes?: PostLikeUncheckedCreateNestedManyWithoutPostInput
    images?: PostImageUncheckedCreateNestedManyWithoutPostInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutPostInput
  }

  export type PostCreateOrConnectWithoutCommentsInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutCommentsInput, PostUncheckedCreateWithoutCommentsInput>
  }

  export type UserCreateWithoutCommentsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicCreateNestedManyWithoutCreatorInput
    topics?: TopicCreateNestedManyWithoutFollowersInput
    reposts?: RepostCreateNestedManyWithoutUserInput
    postLikes?: PostLikeCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationCreateNestedManyWithoutReceiverInput
  }

  export type UserUncheckedCreateWithoutCommentsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicUncheckedCreateNestedManyWithoutCreatorInput
    topics?: TopicUncheckedCreateNestedManyWithoutFollowersInput
    reposts?: RepostUncheckedCreateNestedManyWithoutUserInput
    postLikes?: PostLikeUncheckedCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationUncheckedCreateNestedManyWithoutReceiverInput
  }

  export type UserCreateOrConnectWithoutCommentsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
  }

  export type CommentCreateWithoutRepliesInput = {
    id?: string
    content: string
    createdAt?: Date | string
    post: PostCreateNestedOneWithoutCommentsInput
    author: UserCreateNestedOneWithoutCommentsInput
    parent?: CommentCreateNestedOneWithoutRepliesInput
    likes?: CommentLikeCreateNestedManyWithoutCommentInput
  }

  export type CommentUncheckedCreateWithoutRepliesInput = {
    id?: string
    content: string
    postId: string
    authorId: string
    parentId?: string | null
    createdAt?: Date | string
    likes?: CommentLikeUncheckedCreateNestedManyWithoutCommentInput
  }

  export type CommentCreateOrConnectWithoutRepliesInput = {
    where: CommentWhereUniqueInput
    create: XOR<CommentCreateWithoutRepliesInput, CommentUncheckedCreateWithoutRepliesInput>
  }

  export type CommentCreateWithoutParentInput = {
    id?: string
    content: string
    createdAt?: Date | string
    post: PostCreateNestedOneWithoutCommentsInput
    author: UserCreateNestedOneWithoutCommentsInput
    replies?: CommentCreateNestedManyWithoutParentInput
    likes?: CommentLikeCreateNestedManyWithoutCommentInput
  }

  export type CommentUncheckedCreateWithoutParentInput = {
    id?: string
    content: string
    postId: string
    authorId: string
    createdAt?: Date | string
    replies?: CommentUncheckedCreateNestedManyWithoutParentInput
    likes?: CommentLikeUncheckedCreateNestedManyWithoutCommentInput
  }

  export type CommentCreateOrConnectWithoutParentInput = {
    where: CommentWhereUniqueInput
    create: XOR<CommentCreateWithoutParentInput, CommentUncheckedCreateWithoutParentInput>
  }

  export type CommentCreateManyParentInputEnvelope = {
    data: CommentCreateManyParentInput | CommentCreateManyParentInput[]
    skipDuplicates?: boolean
  }

  export type CommentLikeCreateWithoutCommentInput = {
    id?: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutCommentLikesInput
  }

  export type CommentLikeUncheckedCreateWithoutCommentInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type CommentLikeCreateOrConnectWithoutCommentInput = {
    where: CommentLikeWhereUniqueInput
    create: XOR<CommentLikeCreateWithoutCommentInput, CommentLikeUncheckedCreateWithoutCommentInput>
  }

  export type CommentLikeCreateManyCommentInputEnvelope = {
    data: CommentLikeCreateManyCommentInput | CommentLikeCreateManyCommentInput[]
    skipDuplicates?: boolean
  }

  export type PostUpsertWithoutCommentsInput = {
    update: XOR<PostUpdateWithoutCommentsInput, PostUncheckedUpdateWithoutCommentsInput>
    create: XOR<PostCreateWithoutCommentsInput, PostUncheckedCreateWithoutCommentsInput>
    where?: PostWhereInput
  }

  export type PostUpdateToOneWithWhereWithoutCommentsInput = {
    where?: PostWhereInput
    data: XOR<PostUpdateWithoutCommentsInput, PostUncheckedUpdateWithoutCommentsInput>
  }

  export type PostUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutPostsNestedInput
    reposts?: RepostUpdateManyWithoutPostNestedInput
    likes?: PostLikeUpdateManyWithoutPostNestedInput
    images?: PostImageUpdateManyWithoutPostNestedInput
    notifications?: NotificationUpdateManyWithoutPostNestedInput
    topic?: TopicUpdateOneWithoutPostsNestedInput
  }

  export type PostUncheckedUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    topicId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reposts?: RepostUncheckedUpdateManyWithoutPostNestedInput
    likes?: PostLikeUncheckedUpdateManyWithoutPostNestedInput
    images?: PostImageUncheckedUpdateManyWithoutPostNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutPostNestedInput
  }

  export type UserUpsertWithoutCommentsInput = {
    update: XOR<UserUpdateWithoutCommentsInput, UserUncheckedUpdateWithoutCommentsInput>
    create: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCommentsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCommentsInput, UserUncheckedUpdateWithoutCommentsInput>
  }

  export type UserUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUpdateManyWithoutCreatorNestedInput
    topics?: TopicUpdateManyWithoutFollowersNestedInput
    reposts?: RepostUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUpdateManyWithoutReceiverNestedInput
  }

  export type UserUncheckedUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUncheckedUpdateManyWithoutCreatorNestedInput
    topics?: TopicUncheckedUpdateManyWithoutFollowersNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUncheckedUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUncheckedUpdateManyWithoutReceiverNestedInput
  }

  export type CommentUpsertWithoutRepliesInput = {
    update: XOR<CommentUpdateWithoutRepliesInput, CommentUncheckedUpdateWithoutRepliesInput>
    create: XOR<CommentCreateWithoutRepliesInput, CommentUncheckedCreateWithoutRepliesInput>
    where?: CommentWhereInput
  }

  export type CommentUpdateToOneWithWhereWithoutRepliesInput = {
    where?: CommentWhereInput
    data: XOR<CommentUpdateWithoutRepliesInput, CommentUncheckedUpdateWithoutRepliesInput>
  }

  export type CommentUpdateWithoutRepliesInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: PostUpdateOneRequiredWithoutCommentsNestedInput
    author?: UserUpdateOneRequiredWithoutCommentsNestedInput
    parent?: CommentUpdateOneWithoutRepliesNestedInput
    likes?: CommentLikeUpdateManyWithoutCommentNestedInput
  }

  export type CommentUncheckedUpdateWithoutRepliesInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    likes?: CommentLikeUncheckedUpdateManyWithoutCommentNestedInput
  }

  export type CommentUpsertWithWhereUniqueWithoutParentInput = {
    where: CommentWhereUniqueInput
    update: XOR<CommentUpdateWithoutParentInput, CommentUncheckedUpdateWithoutParentInput>
    create: XOR<CommentCreateWithoutParentInput, CommentUncheckedCreateWithoutParentInput>
  }

  export type CommentUpdateWithWhereUniqueWithoutParentInput = {
    where: CommentWhereUniqueInput
    data: XOR<CommentUpdateWithoutParentInput, CommentUncheckedUpdateWithoutParentInput>
  }

  export type CommentUpdateManyWithWhereWithoutParentInput = {
    where: CommentScalarWhereInput
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyWithoutParentInput>
  }

  export type CommentLikeUpsertWithWhereUniqueWithoutCommentInput = {
    where: CommentLikeWhereUniqueInput
    update: XOR<CommentLikeUpdateWithoutCommentInput, CommentLikeUncheckedUpdateWithoutCommentInput>
    create: XOR<CommentLikeCreateWithoutCommentInput, CommentLikeUncheckedCreateWithoutCommentInput>
  }

  export type CommentLikeUpdateWithWhereUniqueWithoutCommentInput = {
    where: CommentLikeWhereUniqueInput
    data: XOR<CommentLikeUpdateWithoutCommentInput, CommentLikeUncheckedUpdateWithoutCommentInput>
  }

  export type CommentLikeUpdateManyWithWhereWithoutCommentInput = {
    where: CommentLikeScalarWhereInput
    data: XOR<CommentLikeUpdateManyMutationInput, CommentLikeUncheckedUpdateManyWithoutCommentInput>
  }

  export type PostCreateWithoutLikesInput = {
    id?: string
    title?: string | null
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    author: UserCreateNestedOneWithoutPostsInput
    comments?: CommentCreateNestedManyWithoutPostInput
    reposts?: RepostCreateNestedManyWithoutPostInput
    images?: PostImageCreateNestedManyWithoutPostInput
    notifications?: NotificationCreateNestedManyWithoutPostInput
    topic?: TopicCreateNestedOneWithoutPostsInput
  }

  export type PostUncheckedCreateWithoutLikesInput = {
    id?: string
    title?: string | null
    content: string
    authorId: string
    topicId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutPostInput
    reposts?: RepostUncheckedCreateNestedManyWithoutPostInput
    images?: PostImageUncheckedCreateNestedManyWithoutPostInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutPostInput
  }

  export type PostCreateOrConnectWithoutLikesInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutLikesInput, PostUncheckedCreateWithoutLikesInput>
  }

  export type UserCreateWithoutPostLikesInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicCreateNestedManyWithoutCreatorInput
    topics?: TopicCreateNestedManyWithoutFollowersInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    reposts?: RepostCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationCreateNestedManyWithoutReceiverInput
  }

  export type UserUncheckedCreateWithoutPostLikesInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicUncheckedCreateNestedManyWithoutCreatorInput
    topics?: TopicUncheckedCreateNestedManyWithoutFollowersInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    reposts?: RepostUncheckedCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationUncheckedCreateNestedManyWithoutReceiverInput
  }

  export type UserCreateOrConnectWithoutPostLikesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPostLikesInput, UserUncheckedCreateWithoutPostLikesInput>
  }

  export type PostUpsertWithoutLikesInput = {
    update: XOR<PostUpdateWithoutLikesInput, PostUncheckedUpdateWithoutLikesInput>
    create: XOR<PostCreateWithoutLikesInput, PostUncheckedCreateWithoutLikesInput>
    where?: PostWhereInput
  }

  export type PostUpdateToOneWithWhereWithoutLikesInput = {
    where?: PostWhereInput
    data: XOR<PostUpdateWithoutLikesInput, PostUncheckedUpdateWithoutLikesInput>
  }

  export type PostUpdateWithoutLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutPostsNestedInput
    comments?: CommentUpdateManyWithoutPostNestedInput
    reposts?: RepostUpdateManyWithoutPostNestedInput
    images?: PostImageUpdateManyWithoutPostNestedInput
    notifications?: NotificationUpdateManyWithoutPostNestedInput
    topic?: TopicUpdateOneWithoutPostsNestedInput
  }

  export type PostUncheckedUpdateWithoutLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    topicId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutPostNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutPostNestedInput
    images?: PostImageUncheckedUpdateManyWithoutPostNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutPostNestedInput
  }

  export type UserUpsertWithoutPostLikesInput = {
    update: XOR<UserUpdateWithoutPostLikesInput, UserUncheckedUpdateWithoutPostLikesInput>
    create: XOR<UserCreateWithoutPostLikesInput, UserUncheckedCreateWithoutPostLikesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPostLikesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPostLikesInput, UserUncheckedUpdateWithoutPostLikesInput>
  }

  export type UserUpdateWithoutPostLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUpdateManyWithoutCreatorNestedInput
    topics?: TopicUpdateManyWithoutFollowersNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUpdateManyWithoutReceiverNestedInput
  }

  export type UserUncheckedUpdateWithoutPostLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUncheckedUpdateManyWithoutCreatorNestedInput
    topics?: TopicUncheckedUpdateManyWithoutFollowersNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUncheckedUpdateManyWithoutReceiverNestedInput
  }

  export type UserCreateWithoutSentNotificationsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicCreateNestedManyWithoutCreatorInput
    topics?: TopicCreateNestedManyWithoutFollowersInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    reposts?: RepostCreateNestedManyWithoutUserInput
    postLikes?: PostLikeCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeCreateNestedManyWithoutUserInput
    receivedNotifications?: NotificationCreateNestedManyWithoutReceiverInput
  }

  export type UserUncheckedCreateWithoutSentNotificationsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicUncheckedCreateNestedManyWithoutCreatorInput
    topics?: TopicUncheckedCreateNestedManyWithoutFollowersInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    reposts?: RepostUncheckedCreateNestedManyWithoutUserInput
    postLikes?: PostLikeUncheckedCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeUncheckedCreateNestedManyWithoutUserInput
    receivedNotifications?: NotificationUncheckedCreateNestedManyWithoutReceiverInput
  }

  export type UserCreateOrConnectWithoutSentNotificationsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSentNotificationsInput, UserUncheckedCreateWithoutSentNotificationsInput>
  }

  export type UserCreateWithoutReceivedNotificationsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicCreateNestedManyWithoutCreatorInput
    topics?: TopicCreateNestedManyWithoutFollowersInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    reposts?: RepostCreateNestedManyWithoutUserInput
    postLikes?: PostLikeCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutReceivedNotificationsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicUncheckedCreateNestedManyWithoutCreatorInput
    topics?: TopicUncheckedCreateNestedManyWithoutFollowersInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    reposts?: RepostUncheckedCreateNestedManyWithoutUserInput
    postLikes?: PostLikeUncheckedCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutReceivedNotificationsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutReceivedNotificationsInput, UserUncheckedCreateWithoutReceivedNotificationsInput>
  }

  export type PostCreateWithoutNotificationsInput = {
    id?: string
    title?: string | null
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    author: UserCreateNestedOneWithoutPostsInput
    comments?: CommentCreateNestedManyWithoutPostInput
    reposts?: RepostCreateNestedManyWithoutPostInput
    likes?: PostLikeCreateNestedManyWithoutPostInput
    images?: PostImageCreateNestedManyWithoutPostInput
    topic?: TopicCreateNestedOneWithoutPostsInput
  }

  export type PostUncheckedCreateWithoutNotificationsInput = {
    id?: string
    title?: string | null
    content: string
    authorId: string
    topicId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutPostInput
    reposts?: RepostUncheckedCreateNestedManyWithoutPostInput
    likes?: PostLikeUncheckedCreateNestedManyWithoutPostInput
    images?: PostImageUncheckedCreateNestedManyWithoutPostInput
  }

  export type PostCreateOrConnectWithoutNotificationsInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutNotificationsInput, PostUncheckedCreateWithoutNotificationsInput>
  }

  export type UserUpsertWithoutSentNotificationsInput = {
    update: XOR<UserUpdateWithoutSentNotificationsInput, UserUncheckedUpdateWithoutSentNotificationsInput>
    create: XOR<UserCreateWithoutSentNotificationsInput, UserUncheckedCreateWithoutSentNotificationsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSentNotificationsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSentNotificationsInput, UserUncheckedUpdateWithoutSentNotificationsInput>
  }

  export type UserUpdateWithoutSentNotificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUpdateManyWithoutCreatorNestedInput
    topics?: TopicUpdateManyWithoutFollowersNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUpdateManyWithoutUserNestedInput
    receivedNotifications?: NotificationUpdateManyWithoutReceiverNestedInput
  }

  export type UserUncheckedUpdateWithoutSentNotificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUncheckedUpdateManyWithoutCreatorNestedInput
    topics?: TopicUncheckedUpdateManyWithoutFollowersNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUncheckedUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUncheckedUpdateManyWithoutUserNestedInput
    receivedNotifications?: NotificationUncheckedUpdateManyWithoutReceiverNestedInput
  }

  export type UserUpsertWithoutReceivedNotificationsInput = {
    update: XOR<UserUpdateWithoutReceivedNotificationsInput, UserUncheckedUpdateWithoutReceivedNotificationsInput>
    create: XOR<UserCreateWithoutReceivedNotificationsInput, UserUncheckedCreateWithoutReceivedNotificationsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutReceivedNotificationsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutReceivedNotificationsInput, UserUncheckedUpdateWithoutReceivedNotificationsInput>
  }

  export type UserUpdateWithoutReceivedNotificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUpdateManyWithoutCreatorNestedInput
    topics?: TopicUpdateManyWithoutFollowersNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutReceivedNotificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUncheckedUpdateManyWithoutCreatorNestedInput
    topics?: TopicUncheckedUpdateManyWithoutFollowersNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUncheckedUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type PostUpsertWithoutNotificationsInput = {
    update: XOR<PostUpdateWithoutNotificationsInput, PostUncheckedUpdateWithoutNotificationsInput>
    create: XOR<PostCreateWithoutNotificationsInput, PostUncheckedCreateWithoutNotificationsInput>
    where?: PostWhereInput
  }

  export type PostUpdateToOneWithWhereWithoutNotificationsInput = {
    where?: PostWhereInput
    data: XOR<PostUpdateWithoutNotificationsInput, PostUncheckedUpdateWithoutNotificationsInput>
  }

  export type PostUpdateWithoutNotificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutPostsNestedInput
    comments?: CommentUpdateManyWithoutPostNestedInput
    reposts?: RepostUpdateManyWithoutPostNestedInput
    likes?: PostLikeUpdateManyWithoutPostNestedInput
    images?: PostImageUpdateManyWithoutPostNestedInput
    topic?: TopicUpdateOneWithoutPostsNestedInput
  }

  export type PostUncheckedUpdateWithoutNotificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    topicId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutPostNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutPostNestedInput
    likes?: PostLikeUncheckedUpdateManyWithoutPostNestedInput
    images?: PostImageUncheckedUpdateManyWithoutPostNestedInput
  }

  export type CommentCreateWithoutLikesInput = {
    id?: string
    content: string
    createdAt?: Date | string
    post: PostCreateNestedOneWithoutCommentsInput
    author: UserCreateNestedOneWithoutCommentsInput
    parent?: CommentCreateNestedOneWithoutRepliesInput
    replies?: CommentCreateNestedManyWithoutParentInput
  }

  export type CommentUncheckedCreateWithoutLikesInput = {
    id?: string
    content: string
    postId: string
    authorId: string
    parentId?: string | null
    createdAt?: Date | string
    replies?: CommentUncheckedCreateNestedManyWithoutParentInput
  }

  export type CommentCreateOrConnectWithoutLikesInput = {
    where: CommentWhereUniqueInput
    create: XOR<CommentCreateWithoutLikesInput, CommentUncheckedCreateWithoutLikesInput>
  }

  export type UserCreateWithoutCommentLikesInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicCreateNestedManyWithoutCreatorInput
    topics?: TopicCreateNestedManyWithoutFollowersInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    reposts?: RepostCreateNestedManyWithoutUserInput
    postLikes?: PostLikeCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationCreateNestedManyWithoutReceiverInput
  }

  export type UserUncheckedCreateWithoutCommentLikesInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicUncheckedCreateNestedManyWithoutCreatorInput
    topics?: TopicUncheckedCreateNestedManyWithoutFollowersInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    reposts?: RepostUncheckedCreateNestedManyWithoutUserInput
    postLikes?: PostLikeUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationUncheckedCreateNestedManyWithoutReceiverInput
  }

  export type UserCreateOrConnectWithoutCommentLikesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCommentLikesInput, UserUncheckedCreateWithoutCommentLikesInput>
  }

  export type CommentUpsertWithoutLikesInput = {
    update: XOR<CommentUpdateWithoutLikesInput, CommentUncheckedUpdateWithoutLikesInput>
    create: XOR<CommentCreateWithoutLikesInput, CommentUncheckedCreateWithoutLikesInput>
    where?: CommentWhereInput
  }

  export type CommentUpdateToOneWithWhereWithoutLikesInput = {
    where?: CommentWhereInput
    data: XOR<CommentUpdateWithoutLikesInput, CommentUncheckedUpdateWithoutLikesInput>
  }

  export type CommentUpdateWithoutLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: PostUpdateOneRequiredWithoutCommentsNestedInput
    author?: UserUpdateOneRequiredWithoutCommentsNestedInput
    parent?: CommentUpdateOneWithoutRepliesNestedInput
    replies?: CommentUpdateManyWithoutParentNestedInput
  }

  export type CommentUncheckedUpdateWithoutLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: CommentUncheckedUpdateManyWithoutParentNestedInput
  }

  export type UserUpsertWithoutCommentLikesInput = {
    update: XOR<UserUpdateWithoutCommentLikesInput, UserUncheckedUpdateWithoutCommentLikesInput>
    create: XOR<UserCreateWithoutCommentLikesInput, UserUncheckedCreateWithoutCommentLikesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCommentLikesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCommentLikesInput, UserUncheckedUpdateWithoutCommentLikesInput>
  }

  export type UserUpdateWithoutCommentLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUpdateManyWithoutCreatorNestedInput
    topics?: TopicUpdateManyWithoutFollowersNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUpdateManyWithoutReceiverNestedInput
  }

  export type UserUncheckedUpdateWithoutCommentLikesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUncheckedUpdateManyWithoutCreatorNestedInput
    topics?: TopicUncheckedUpdateManyWithoutFollowersNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUncheckedUpdateManyWithoutReceiverNestedInput
  }

  export type PostCreateWithoutRepostsInput = {
    id?: string
    title?: string | null
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    author: UserCreateNestedOneWithoutPostsInput
    comments?: CommentCreateNestedManyWithoutPostInput
    likes?: PostLikeCreateNestedManyWithoutPostInput
    images?: PostImageCreateNestedManyWithoutPostInput
    notifications?: NotificationCreateNestedManyWithoutPostInput
    topic?: TopicCreateNestedOneWithoutPostsInput
  }

  export type PostUncheckedCreateWithoutRepostsInput = {
    id?: string
    title?: string | null
    content: string
    authorId: string
    topicId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutPostInput
    likes?: PostLikeUncheckedCreateNestedManyWithoutPostInput
    images?: PostImageUncheckedCreateNestedManyWithoutPostInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutPostInput
  }

  export type PostCreateOrConnectWithoutRepostsInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutRepostsInput, PostUncheckedCreateWithoutRepostsInput>
  }

  export type UserCreateWithoutRepostsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicCreateNestedManyWithoutCreatorInput
    topics?: TopicCreateNestedManyWithoutFollowersInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    postLikes?: PostLikeCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationCreateNestedManyWithoutReceiverInput
  }

  export type UserUncheckedCreateWithoutRepostsInput = {
    id?: string
    email: string
    password: string
    name?: string | null
    role?: string
    banned?: boolean
    avatar?: string | null
    bio?: string | null
    postViewMode?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    createdTopics?: TopicUncheckedCreateNestedManyWithoutCreatorInput
    topics?: TopicUncheckedCreateNestedManyWithoutFollowersInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    postLikes?: PostLikeUncheckedCreateNestedManyWithoutUserInput
    commentLikes?: CommentLikeUncheckedCreateNestedManyWithoutUserInput
    sentNotifications?: NotificationUncheckedCreateNestedManyWithoutSenderInput
    receivedNotifications?: NotificationUncheckedCreateNestedManyWithoutReceiverInput
  }

  export type UserCreateOrConnectWithoutRepostsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRepostsInput, UserUncheckedCreateWithoutRepostsInput>
  }

  export type PostUpsertWithoutRepostsInput = {
    update: XOR<PostUpdateWithoutRepostsInput, PostUncheckedUpdateWithoutRepostsInput>
    create: XOR<PostCreateWithoutRepostsInput, PostUncheckedCreateWithoutRepostsInput>
    where?: PostWhereInput
  }

  export type PostUpdateToOneWithWhereWithoutRepostsInput = {
    where?: PostWhereInput
    data: XOR<PostUpdateWithoutRepostsInput, PostUncheckedUpdateWithoutRepostsInput>
  }

  export type PostUpdateWithoutRepostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutPostsNestedInput
    comments?: CommentUpdateManyWithoutPostNestedInput
    likes?: PostLikeUpdateManyWithoutPostNestedInput
    images?: PostImageUpdateManyWithoutPostNestedInput
    notifications?: NotificationUpdateManyWithoutPostNestedInput
    topic?: TopicUpdateOneWithoutPostsNestedInput
  }

  export type PostUncheckedUpdateWithoutRepostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    topicId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutPostNestedInput
    likes?: PostLikeUncheckedUpdateManyWithoutPostNestedInput
    images?: PostImageUncheckedUpdateManyWithoutPostNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutPostNestedInput
  }

  export type UserUpsertWithoutRepostsInput = {
    update: XOR<UserUpdateWithoutRepostsInput, UserUncheckedUpdateWithoutRepostsInput>
    create: XOR<UserCreateWithoutRepostsInput, UserUncheckedCreateWithoutRepostsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRepostsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRepostsInput, UserUncheckedUpdateWithoutRepostsInput>
  }

  export type UserUpdateWithoutRepostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUpdateManyWithoutCreatorNestedInput
    topics?: TopicUpdateManyWithoutFollowersNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    postLikes?: PostLikeUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUpdateManyWithoutReceiverNestedInput
  }

  export type UserUncheckedUpdateWithoutRepostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUncheckedUpdateManyWithoutCreatorNestedInput
    topics?: TopicUncheckedUpdateManyWithoutFollowersNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    postLikes?: PostLikeUncheckedUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUncheckedUpdateManyWithoutReceiverNestedInput
  }

  export type PostCreateManyAuthorInput = {
    id?: string
    title?: string | null
    content: string
    topicId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TopicCreateManyCreatorInput = {
    id?: string
    name: string
    description?: string | null
    icon?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentCreateManyAuthorInput = {
    id?: string
    content: string
    postId: string
    parentId?: string | null
    createdAt?: Date | string
  }

  export type RepostCreateManyUserInput = {
    id?: string
    postId: string
  }

  export type PostLikeCreateManyUserInput = {
    id?: string
    postId: string
    createdAt?: Date | string
  }

  export type CommentLikeCreateManyUserInput = {
    id?: string
    commentId: string
    createdAt?: Date | string
  }

  export type NotificationCreateManySenderInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    receiverId: string
    postId?: string | null
    commentId?: string | null
    createdAt?: Date | string
  }

  export type NotificationCreateManyReceiverInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    senderId: string
    postId?: string | null
    commentId?: string | null
    createdAt?: Date | string
  }

  export type PostUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUpdateManyWithoutPostNestedInput
    reposts?: RepostUpdateManyWithoutPostNestedInput
    likes?: PostLikeUpdateManyWithoutPostNestedInput
    images?: PostImageUpdateManyWithoutPostNestedInput
    notifications?: NotificationUpdateManyWithoutPostNestedInput
    topic?: TopicUpdateOneWithoutPostsNestedInput
  }

  export type PostUncheckedUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    topicId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutPostNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutPostNestedInput
    likes?: PostLikeUncheckedUpdateManyWithoutPostNestedInput
    images?: PostImageUncheckedUpdateManyWithoutPostNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutPostNestedInput
  }

  export type PostUncheckedUpdateManyWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    topicId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutTopicNestedInput
    followers?: UserUpdateManyWithoutTopicsNestedInput
  }

  export type TopicUncheckedUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutTopicNestedInput
    followers?: UserUncheckedUpdateManyWithoutTopicsNestedInput
  }

  export type TopicUncheckedUpdateManyWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicUpdateWithoutFollowersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutTopicNestedInput
    creator?: UserUpdateOneWithoutCreatedTopicsNestedInput
  }

  export type TopicUncheckedUpdateWithoutFollowersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    creatorId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutTopicNestedInput
  }

  export type TopicUncheckedUpdateManyWithoutFollowersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    creatorId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: PostUpdateOneRequiredWithoutCommentsNestedInput
    parent?: CommentUpdateOneWithoutRepliesNestedInput
    replies?: CommentUpdateManyWithoutParentNestedInput
    likes?: CommentLikeUpdateManyWithoutCommentNestedInput
  }

  export type CommentUncheckedUpdateWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: CommentUncheckedUpdateManyWithoutParentNestedInput
    likes?: CommentLikeUncheckedUpdateManyWithoutCommentNestedInput
  }

  export type CommentUncheckedUpdateManyWithoutAuthorInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RepostUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    post?: PostUpdateOneRequiredWithoutRepostsNestedInput
  }

  export type RepostUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
  }

  export type RepostUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
  }

  export type PostLikeUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: PostUpdateOneRequiredWithoutLikesNestedInput
  }

  export type PostLikeUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostLikeUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentLikeUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comment?: CommentUpdateOneRequiredWithoutLikesNestedInput
  }

  export type CommentLikeUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    commentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentLikeUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    commentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUpdateWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    receiver?: UserUpdateOneRequiredWithoutReceivedNotificationsNestedInput
    post?: PostUpdateOneWithoutNotificationsNestedInput
  }

  export type NotificationUncheckedUpdateWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    receiverId?: StringFieldUpdateOperationsInput | string
    postId?: NullableStringFieldUpdateOperationsInput | string | null
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateManyWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    receiverId?: StringFieldUpdateOperationsInput | string
    postId?: NullableStringFieldUpdateOperationsInput | string | null
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUpdateWithoutReceiverInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutSentNotificationsNestedInput
    post?: PostUpdateOneWithoutNotificationsNestedInput
  }

  export type NotificationUncheckedUpdateWithoutReceiverInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    senderId?: StringFieldUpdateOperationsInput | string
    postId?: NullableStringFieldUpdateOperationsInput | string | null
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateManyWithoutReceiverInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    senderId?: StringFieldUpdateOperationsInput | string
    postId?: NullableStringFieldUpdateOperationsInput | string | null
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentCreateManyPostInput = {
    id?: string
    content: string
    authorId: string
    parentId?: string | null
    createdAt?: Date | string
  }

  export type RepostCreateManyPostInput = {
    id?: string
    userId: string
  }

  export type PostLikeCreateManyPostInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type PostImageCreateManyPostInput = {
    id?: string
    url: string
    createdAt?: Date | string
  }

  export type NotificationCreateManyPostInput = {
    id?: string
    type: $Enums.NotificationType
    isRead?: boolean
    senderId: string
    receiverId: string
    commentId?: string | null
    createdAt?: Date | string
  }

  export type CommentUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutCommentsNestedInput
    parent?: CommentUpdateOneWithoutRepliesNestedInput
    replies?: CommentUpdateManyWithoutParentNestedInput
    likes?: CommentLikeUpdateManyWithoutCommentNestedInput
  }

  export type CommentUncheckedUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: CommentUncheckedUpdateManyWithoutParentNestedInput
    likes?: CommentLikeUncheckedUpdateManyWithoutCommentNestedInput
  }

  export type CommentUncheckedUpdateManyWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RepostUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    user?: UserUpdateOneRequiredWithoutRepostsNestedInput
  }

  export type RepostUncheckedUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type RepostUncheckedUpdateManyWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type PostLikeUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutPostLikesNestedInput
  }

  export type PostLikeUncheckedUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostLikeUncheckedUpdateManyWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostImageUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostImageUncheckedUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostImageUncheckedUpdateManyWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutSentNotificationsNestedInput
    receiver?: UserUpdateOneRequiredWithoutReceivedNotificationsNestedInput
  }

  export type NotificationUncheckedUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    senderId?: StringFieldUpdateOperationsInput | string
    receiverId?: StringFieldUpdateOperationsInput | string
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateManyWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    isRead?: BoolFieldUpdateOperationsInput | boolean
    senderId?: StringFieldUpdateOperationsInput | string
    receiverId?: StringFieldUpdateOperationsInput | string
    commentId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostCreateManyTopicInput = {
    id?: string
    title?: string | null
    content: string
    authorId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUpdateWithoutTopicInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutPostsNestedInput
    comments?: CommentUpdateManyWithoutPostNestedInput
    reposts?: RepostUpdateManyWithoutPostNestedInput
    likes?: PostLikeUpdateManyWithoutPostNestedInput
    images?: PostImageUpdateManyWithoutPostNestedInput
    notifications?: NotificationUpdateManyWithoutPostNestedInput
  }

  export type PostUncheckedUpdateWithoutTopicInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutPostNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutPostNestedInput
    likes?: PostLikeUncheckedUpdateManyWithoutPostNestedInput
    images?: PostImageUncheckedUpdateManyWithoutPostNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutPostNestedInput
  }

  export type PostUncheckedUpdateManyWithoutTopicInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUpdateWithoutTopicsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUpdateManyWithoutCreatorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUpdateManyWithoutReceiverNestedInput
  }

  export type UserUncheckedUpdateWithoutTopicsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    createdTopics?: TopicUncheckedUpdateManyWithoutCreatorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    reposts?: RepostUncheckedUpdateManyWithoutUserNestedInput
    postLikes?: PostLikeUncheckedUpdateManyWithoutUserNestedInput
    commentLikes?: CommentLikeUncheckedUpdateManyWithoutUserNestedInput
    sentNotifications?: NotificationUncheckedUpdateManyWithoutSenderNestedInput
    receivedNotifications?: NotificationUncheckedUpdateManyWithoutReceiverNestedInput
  }

  export type UserUncheckedUpdateManyWithoutTopicsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    role?: StringFieldUpdateOperationsInput | string
    banned?: BoolFieldUpdateOperationsInput | boolean
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    postViewMode?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentCreateManyParentInput = {
    id?: string
    content: string
    postId: string
    authorId: string
    createdAt?: Date | string
  }

  export type CommentLikeCreateManyCommentInput = {
    id?: string
    userId: string
    createdAt?: Date | string
  }

  export type CommentUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: PostUpdateOneRequiredWithoutCommentsNestedInput
    author?: UserUpdateOneRequiredWithoutCommentsNestedInput
    replies?: CommentUpdateManyWithoutParentNestedInput
    likes?: CommentLikeUpdateManyWithoutCommentNestedInput
  }

  export type CommentUncheckedUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: CommentUncheckedUpdateManyWithoutParentNestedInput
    likes?: CommentLikeUncheckedUpdateManyWithoutCommentNestedInput
  }

  export type CommentUncheckedUpdateManyWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    authorId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentLikeUpdateWithoutCommentInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCommentLikesNestedInput
  }

  export type CommentLikeUncheckedUpdateWithoutCommentInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentLikeUncheckedUpdateManyWithoutCommentInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use UserCountOutputTypeDefaultArgs instead
     */
    export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PostCountOutputTypeDefaultArgs instead
     */
    export type PostCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PostCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TopicCountOutputTypeDefaultArgs instead
     */
    export type TopicCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TopicCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CommentCountOutputTypeDefaultArgs instead
     */
    export type CommentCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CommentCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PostDefaultArgs instead
     */
    export type PostArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PostDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TopicDefaultArgs instead
     */
    export type TopicArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TopicDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PostImageDefaultArgs instead
     */
    export type PostImageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PostImageDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CommentDefaultArgs instead
     */
    export type CommentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CommentDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PostLikeDefaultArgs instead
     */
    export type PostLikeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PostLikeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use NotificationDefaultArgs instead
     */
    export type NotificationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = NotificationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CommentLikeDefaultArgs instead
     */
    export type CommentLikeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CommentLikeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use RepostDefaultArgs instead
     */
    export type RepostArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = RepostDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}

Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  detectRuntime,
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.10.2
 * Query Engine version: 5a9203d0590c951969e85a7d07215503f4672eb9
 */
Prisma.prismaVersion = {
  client: "5.10.2",
  engine: "5a9203d0590c951969e85a7d07215503f4672eb9"
}

Prisma.PrismaClientKnownRequestError = () => {
  throw new Error(`PrismaClientKnownRequestError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  throw new Error(`PrismaClientUnknownRequestError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  throw new Error(`PrismaClientRustPanicError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  throw new Error(`PrismaClientInitializationError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  throw new Error(`PrismaClientValidationError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  throw new Error(`NotFoundError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  throw new Error(`sqltag is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  throw new Error(`empty is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  throw new Error(`join is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  throw new Error(`raw is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  throw new Error(`Extensions.getExtensionContext is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  throw new Error(`Extensions.defineExtension is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  name: 'name',
  role: 'role',
  banned: 'banned',
  avatar: 'avatar',
  bio: 'bio',
  postViewMode: 'postViewMode',
  coverImage: 'coverImage',
  showUserData: 'showUserData',
  experience: 'experience',
  lastLoginRewardAt: 'lastLoginRewardAt',
  dailyLikeRewardCount: 'dailyLikeRewardCount',
  lastLikeRewardAt: 'lastLikeRewardAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PostScalarFieldEnum = {
  id: 'id',
  title: 'title',
  content: 'content',
  authorId: 'authorId',
  topicId: 'topicId',
  viewCount: 'viewCount',
  pinned: 'pinned',
  pinnedAt: 'pinnedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TopicScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  icon: 'icon',
  creatorId: 'creatorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PostImageScalarFieldEnum = {
  id: 'id',
  url: 'url',
  postId: 'postId',
  createdAt: 'createdAt'
};

exports.Prisma.PostAttachmentScalarFieldEnum = {
  id: 'id',
  url: 'url',
  fileName: 'fileName',
  fileSize: 'fileSize',
  mimeType: 'mimeType',
  downloadCount: 'downloadCount',
  postId: 'postId',
  createdAt: 'createdAt'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  content: 'content',
  postId: 'postId',
  authorId: 'authorId',
  parentId: 'parentId',
  pinned: 'pinned',
  pinnedAt: 'pinnedAt',
  createdAt: 'createdAt'
};

exports.Prisma.PostLikeScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  type: 'type',
  isRead: 'isRead',
  senderId: 'senderId',
  receiverId: 'receiverId',
  postId: 'postId',
  commentId: 'commentId',
  createdAt: 'createdAt'
};

exports.Prisma.PushDeviceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  registrationId: 'registrationId',
  platform: 'platform',
  appPackage: 'appPackage',
  appVersion: 'appVersion',
  isActive: 'isActive',
  lastSeenAt: 'lastSeenAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PushLogScalarFieldEnum = {
  id: 'id',
  notificationId: 'notificationId',
  deviceId: 'deviceId',
  registrationId: 'registrationId',
  requestId: 'requestId',
  status: 'status',
  attemptCount: 'attemptCount',
  error: 'error',
  sentAt: 'sentAt',
  nextRetryAt: 'nextRetryAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommentLikeScalarFieldEnum = {
  id: 'id',
  commentId: 'commentId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.RepostScalarFieldEnum = {
  id: 'id',
  postId: 'postId',
  userId: 'userId'
};

exports.Prisma.FollowScalarFieldEnum = {
  id: 'id',
  followerId: 'followerId',
  followingId: 'followingId',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.NotificationType = exports.$Enums.NotificationType = {
  REPLY_POST: 'REPLY_POST',
  REPLY_COMMENT: 'REPLY_COMMENT',
  LIKE_POST: 'LIKE_POST',
  LIKE_COMMENT: 'LIKE_COMMENT',
  FOLLOW_USER: 'FOLLOW_USER'
};

exports.PushPlatform = exports.$Enums.PushPlatform = {
  IOS: 'IOS',
  ANDROID: 'ANDROID',
  HARMONY: 'HARMONY',
  OTHER: 'OTHER'
};

exports.PushLogStatus = exports.$Enums.PushLogStatus = {
  PENDING: 'PENDING',
  RETRYING: 'RETRYING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Post: 'Post',
  Topic: 'Topic',
  PostImage: 'PostImage',
  PostAttachment: 'PostAttachment',
  Comment: 'Comment',
  PostLike: 'PostLike',
  Notification: 'Notification',
  PushDevice: 'PushDevice',
  PushLog: 'PushLog',
  CommentLike: 'CommentLike',
  Repost: 'Repost',
  Follow: 'Follow'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        const runtime = detectRuntime()
        const edgeRuntimeName = {
          'workerd': 'Cloudflare Workers',
          'deno': 'Deno and Deno Deploy',
          'netlify': 'Netlify Edge Functions',
          'edge-light': 'Vercel Edge Functions or Edge Middleware',
        }[runtime]

        let message = 'PrismaClient is unable to run in '
        if (edgeRuntimeName !== undefined) {
          message += edgeRuntimeName + '. As an alternative, try Accelerate: https://pris.ly/d/accelerate.'
        } else {
          message += 'this browser environment, or has been bundled for the browser (running in `' + runtime + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)

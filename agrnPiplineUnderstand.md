
##  First, What Is an Aggregation Pipeline?

In MongoDB, an **aggregation pipeline** is like a **series of steps** (or filters) applied to documents in a collection — kind of like how you'd run queries step by step in SQL.

Each stage (step) transforms the documents — filter, reshape, join other collections, group, sort, etc.

---
# for Subscription concept...in...getuserProfile
##  What's Your Goal Here?

You want to show a user’s **channel profile** with:

* Their basic info (name, avatar, etc.)
* How many people **subscribe to** them → (`subscribers`)
* How many channels **they’ve subscribed to** → (`subscribedTo`)
* Whether the **current logged-in user is subscribed to them**

---

##  The Collections Involved

###  `User` Collection (like this):

```json
{
  _id: ObjectId("..."),
  username: "one",
  fullName: "One Singh",
  avatar: "url",
  ...
}
```

###  `Subscription` Collection (like this):

```json
{
  _id: ObjectId("..."),
  subscriber: ObjectId("user1"),
  channel: ObjectId("user2")  // user2 is the one being followed
}
```

---

##  Step-by-Step Explanation of  Pipeline

### 1. `$match`

 -> Find the user with the provided username

```js
{
  $match: {
    username: username?.toLowerCase()
  }
}
```

---

### 2. First `$lookup`

 -> Find **who is subscribing to this user**

```js
{
  $lookup: {
    from: "subscriptions",         // collection name
    localField: "_id",             // user's _id
    foreignField: "channel",       // match users where they are the channel
    as: "subscribers"              // store matched results in `subscribers` array
  }
}
```

  Result: now your user document has:

```json
"subscribers": [
  { subscriber: ObjectId("userA"), channel: ObjectId("userB") },
  ...
]
```

---

### 3. Second `$lookup`

 -> Find **which channels this user is subscribed to**

```js
{
  $lookup: {
    from: "subscriptions",
    localField: "_id",
    foreignField: "subscriber",    // match users where they are the one subscribing
    as: "subscribedTo"
  }
}
```

  Result: now your user doc has:

```json
"subscribedTo": [
  { subscriber: ObjectId("userB"), channel: ObjectId("userC") },
  ...
]
```

---

### 4. `$addFields`

 -> Add computed values:

#### - `subscribersCount`: how many people subscribe to me

```js
subscribersCount: {
  $size: "$subscribers"
}
```

#### - `channelSubscribedToCount`: how many people I follow

```js
channelSubscribedToCount: {
  $size: "$subscribedTo"
}
```

#### - `isSubscribed`: is the **current logged-in user** subscribed to me?

```js
isSubscribed: {
  $cond: {
    if: { $in: [req.user._id, "$subscribers.subscriber"] },
    then: true,
    else: false
  }
}
```

🛑 This line can cause issues if `$subscribers.subscriber` isn’t correctly treated as an array — but the logic is: “Is the logged-in user present in the list of subscribers?”

---

### 5. `$project`

 -> Only send back these fields to the frontend:

```js
{
  fullName: 1,
  username: 1,
  subscribersCount: 1,
  channelSubscribedToCount: 1,
  avatar: 1,
  coverImage: 1,
  email: 1
}
```

---

##  Final Output

One user object, shaped like this:

```json
{
  "fullName": "One Singh",
  "username": "one",
  "avatar": "...",
  "coverImage": "...",
  "email": "one@gmail.com",
  "subscribersCount": 23,
  "channelSubscribedToCount": 10,
  "isSubscribed": true
}
```

---

##  Summary

| Stage        | What It Does                                                  |
| ------------ | ------------------------------------------------------------- |
| `$match`     | Filters the user based on username                            |
| `$lookup #1` | Finds everyone **subscribing to** this user                   |
| `$lookup #2` | Finds everyone this user **has subscribed to**                |
| `$addFields` | Adds counts and a boolean for "is subscribed by current user" |
| `$project`   | Returns only required fields to frontend                      |

---
# for watchhistory
##  Schema Recap (Important for Understanding Logic)

```js
watchHistory: [
  {
    type: Schema.Types.ObjectId,
    ref: "Video"
  }
]
```

This means each user has an array of **video IDs** they have watched.

---

##  Aggregation Pipeline: Explained Line-by-Line

```js
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
```

You're aggregating from the `users` collection to get the **current logged-in user’s watch history**.

---

###  1. `$match` Stage

```js
{
  $match: {
    _id: new mongoose.Types.ObjectId(req.user._id)
  }
}
```

  This filters the `users` collection to return **only the logged-in user**.

---

###  2. `$lookup` on `videos` collection

```js
{
  $lookup: {
    from: "videos",
    localField: "watchHistory",   // array of video IDs
    foreignField: "_id",          // match videos by _id
    as: "watchHistory",
```

  This finds all video documents that match the IDs in `user.watchHistory`.

This replaces the array of video IDs with **full video documents**.

---

###   Nested `pipeline` inside the `$lookup`

Now you're enriching each video with the details of its **owner** (the user who uploaded it).

---

####   2.1 Inner `$lookup` on `users` collection

```js
$lookup: {
  from: "users",
  localField: "owner",
  foreignField: "_id",
  as: "owner",
  pipeline: [
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1
      }
    }
  ]
}
```

  This means:

> For each video, find its `owner` user and only return their `fullName`, `username`, and `avatar`.

  Result example:

```js
{
  _id: video1,
  title: "Node.js Tutorial",
  owner: [
    {
      fullName: "Kaberi Acharya",
      username: "kaberi",
      avatar: "url"
    }
  ]
}
```

---

####   2.2 Flatten the owner array

```js
$addFields: {
  owner: {
    $first: "$owner"
  }
}
```

  This changes the `"owner"` field from an array (`[ {...} ]`) to just the object (`{...}`), so the frontend gets a clean structure.

---

###   Final Output after Aggregation

After this whole pipeline, you'll get:

```json
[
  {
    _id: "userId",
    ...,
    watchHistory: [
      {
        _id: "video1",
        title: "...",
        owner: {
          fullName: "Kaberi Acharya",
          username: "kaberi",
          avatar: "..."
        }
      },
      {
        _id: "video2",
        ...
      }
    ]
  }
]
```

---

###   Return Result to Client

You'll then do:

```js
res.status(200).json(
  new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully")
)
```

  So the client only receives the **array of watched videos with owner info**.

---

##   Summary of How It Works

| Step                            | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `$match`                        | Find the current user                           |
| `$lookup` (videos)              | Replace `watchHistory` IDs with full video docs |
| `$lookup` (users inside videos) | Add info about who owns each video              |
| `$addFields`                    | Flatten owner array to a clean object           |
| Final Response                  | Just send the `watchHistory` array back         |

---

var express = require('express'); 
var router = express.Router(); 

const User = require('../models/users'); 
const Tweet = require('../models/tweets'); 

const { checkBody } = require('../modules/checkBody');

router.post('/', (req, res) => {
  
  if (!checkBody(req.body, ['token', 'content'])) {
    res.json({ result: false, error: 'Missing or empty fields' })
    return;
  }

  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    const newTweet = new Tweet({
      author: user._id,
      content: req.body.content, 
      createdAt: new Date(), 
    });

    newTweet.save().then(newDoc => {
      res.json({ result: true, tweet: newDoc });
    });
  });
});

router.get('/all', async (req, res) => {
  try {
    const tweets = await Tweet.find()
      .populate('author', ['username', 'firstName']) 
      .populate('likes', ['username'])  
      .sort({ createdAt: 'desc' }); 

    res.json({ result: true, tweets });
  } catch (error) {
    res.json({ result: false, error: 'Failed to fetch tweets' });
  }
});

router.get('/trends', async (req, res) => {
  try {
    const tweets = await Tweet.find();
    
    const hashtags = tweets
      .flatMap(tweet => tweet.content.match(/#[a-zA-Z0-9_]+/g))
      .filter(Boolean);
    
    const hashtagCounts = hashtags.reduce((acc, hashtag) => {
      acc[hashtag] = (acc[hashtag] || 0) + 1;
      return acc;
    }, {});

    const popularHashtags = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([hashtag]) => hashtag);

    res.json({ result: true, trends: popularHashtags });
  } catch (error) {
    res.json({ result: false, error: 'Failed to fetch trends' });
  }
});

router.get('/hashtag/:hashtag', async (req, res) => {
  try {
    const hashtag = `#${req.params.hashtag}`; 
    const tweets = await Tweet.find({ content: { $regex: hashtag, $options: 'i' } })
      .populate('author', ['username', 'firstName'])
      .populate('likes', ['username'])
      .sort({ createdAt: 'desc' });

    if (tweets.length > 0) {
      res.json({ result: true, tweets });
    } else {
      res.json({ result: false, message: 'No tweets found for this hashtag' });
    }
  } catch (error) {
    res.json({ result: false, error: 'Failed to fetch tweets for this hashtag' });
  }
});

router.put('/like', (req, res) => {
  if (!checkBody(req.body, ['token', 'tweetId'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    Tweet.findById(req.body.tweetId).then(tweet => {
      if (!tweet) {
        res.json({ result: false, error: 'Tweet not found' });
        return;
      }

      if (tweet.likes.includes(user._id)) { 
        Tweet.updateOne({ _id: tweet._id }, { $pull: { likes: user._id } }) 
          .then(() => {
            res.json({ result: true });
          });
      } else {
        Tweet.updateOne({ _id: tweet._id }, { $push: { likes: user._id } })
          .then(() => {
            res.json({ result: true });
          });
      }
    });
  });
});

router.delete('/', (req, res) => {
  if (!checkBody(req.body, ['token', 'tweetId'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    Tweet.findById(req.body.tweetId)
      .populate('author')
      .then(tweet => {
        if (!tweet) {
          res.json({ result: false, error: 'Tweet not found' });
          return;
        } else if (String(tweet.author._id) !== String(user._id)) {
          res.json({ result: false, error: 'Tweet can only be deleted by its author' });
          return;
        }

        Tweet.deleteOne({ _id: tweet._id }).then(() => {
          res.json({ result: true });
        });
      });
  });
});

module.exports = router;
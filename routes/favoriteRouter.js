const express = require('express');
const Favorite = require('../models/favorites');
const authenticate = require('../authenticate');
const cors = require('./cors');
const favorites = require('../models/favorites');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find({ user: req.user._id })
            .populate('user')
            .populate('campsites')
            .then(favorites => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            })
            .catch(err => next(err));

    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    req.body.forEach(fav => {
                        if (!favorite.campsites.includes(fav._id)) {
                            favorite.campsites.push(fav._id);
                        }
                    })
                    favorite.save();
                } else {
                    Favorite.create({
                        user: req.user._id,
                        campsites: req.body
                    })
                        .then(favorites => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorites);
                        })
                }
            })
            .catch(err => next(err));

    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not support on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({ user: req.user._id })
            .then(favorite => {
                res.statusCode = 200;
                if (favorite) {
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                } else {
                    res.setHeader('Content-Type', 'plain/text');
                    res.end('You do not have any favorites to delete');
                }
            })
            .catch(err => next(err));
    });


favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`GET operation not support on /favorites/${req.params.campsiteId}`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorites => {
                if (favorites) {
                    if (favorites.campsites.includes(req.params.campsiteId)) {
                        res.end('This campsite is already a favorite');
                    } else {
                        favorites.campsites.push(req.params.campsiteId);
                        favorites.save()
                            .then(favorites => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorites);
                            })
                    }
                } else {
                    Favorite.create({
                        user: req.user._id,
                        campsites: [req.params.campsiteId],
                    })
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                }
            })


    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not support on /favorites/${req.params.campsiteId
            }`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    const index = favorite.campsites.indexOf(req.params.campsiteId);
                    if (index >= 0) {
                        favorite.campsites.splice(index, 1);
                        favorite.save()
                            .then(favorite => {
                                Favorite.findById(favorite._id)
                                    .then(favorite => {
                                        console.log('Favorite Campsite Deleted', favorite);
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json({
                                            "Message": `Favorite campsite ${req.params.campsiteId} deleted`,
                                            "Favorites": favorite
                                        });
                                    });
                            })
                            .catch(err => next(err));
                    } else {
                        res.statusCode = 400;
                        res.setHeader('Content-Type', 'plain/text');
                        res.end('This is not a favorite campsite');
                    }
                }
            })
            .catch(err => next(err));

    });


module.exports = favoriteRouter;
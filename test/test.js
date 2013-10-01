var groove = require('../');
var assert = require('assert');
var path = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;
var test = require('tap').test;
var testOgg = path.join(__dirname, "danse.ogg");
var bogusFile = __filename;
var rwTestOgg = path.join(__dirname, "danse-rw.ogg");

test("logging", function(t) {
    t.strictEqual(groove.LOG_ERROR, 16);
    groove.setLogging(groove.LOG_INFO);
    t.end();
});

test("open fails for bogus file", function(t) {
    t.plan(1);
    groove.open(bogusFile, function(err, file) {
        t.equal(err.message, "open file failed");
    });
});

test("open file and read metadata", function(t) {
    t.plan(10);
    groove.open(testOgg, function(err, file) {
        t.ok(!err);
        t.ok(file.id);
        t.equal(file.filename, testOgg);
        t.equal(file.dirty, false);
        t.equal(file.metadata().TITLE, 'Danse Macabre');
        t.equal(file.metadata().ARTIST, 'Kevin MacLeod');
        t.equal(file.shortNames(), 'ogg');
        t.equal(file.getMetadata('initial key'), 'C');
        t.equal(file.getMetadata('bogus nonexisting tag'), null);
        file.close(function(err) {
            t.ok(!err);
        });
    });
});

test("update metadata", function(t) {
    t.plan(7);
    ncp(testOgg, rwTestOgg, function(err) {
        t.ok(!err);
        groove.open(rwTestOgg, doUpdate);
    });
    function doUpdate(err, file) {
        t.ok(!err);
        file.setMetadata('foo new key', "libgroove rules!");
        t.equal(file.getMetadata('foo new key'), 'libgroove rules!');
        file.save(function(err) {
            t.ok(!err);
            file.close(checkUpdate);
        });
    }
    function checkUpdate(err) {
        t.ok(!err);
        groove.open(rwTestOgg, function(err, file) {
            t.ok(!err);
            t.equal(file.getMetadata('foo new key'), 'libgroove rules!', "update worked");
            fs.unlinkSync(rwTestOgg);
        });
    }
});

test("create and destroy empty player", function (t) {
    t.plan(4);
    groove.createPlayer(function(err, player) {
        t.ok(player.id);
        t.ok(!err, "creating player");
        t.equivalent(player.playlist(), [], "empty playlist");
        player.destroy(function(err) {
            t.ok(!err, "destroying player");
        });
    });
});

test("playlist item ids", function(t) {
    t.plan(9);
    groove.createPlayer(function(err, player) {
        t.ok(!err, "creating player");
        player.pause();
        t.equal(player.playing(), false);
        groove.open(testOgg, function(err, file) {
            t.ok(!err, "opening file");
            t.ok(player.decodePosition);
            t.equal(player.volume, 1.0);
            player.setVolume(1.0);
            var returned1 = player.insert(file, null);
            var returned2 = player.insert(file, null);
            var items1 = player.playlist();
            var items2 = player.playlist();
            t.equal(items1[0].id, items2[0].id);
            t.equal(items1[0].id, returned1.id);
            t.equal(items2[1].id, returned2.id);
            player.destroy(function(err) {
                t.ok(!err, "destroying player");
            });
        });
    });
});


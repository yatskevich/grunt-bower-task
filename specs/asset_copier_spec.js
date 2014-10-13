'use strict';
/* jshint expr: true */
/* global describe:false, it:false */

var chai = require('chai'),
    should = chai.should(),
    Copier = require('../tasks/lib/asset_copier');

describe('Asset Copier:', function(){
    var AssetCopier = new Copier();

    describe('Method findMainFile', function(){
        it('should never abort on errors/exceptions', function(){
            var src = 'sdfs$%$£%$%&%^*$&^*@£$@£$@sdfsd',
                pkg = 'sdfsdf!@£$%^&*()_+=}{sdfsd';

            (AssetCopier.findMainFile.bind(AssetCopier, src, pkg)).should.not.throw(ReferenceError);
        });
    });
});

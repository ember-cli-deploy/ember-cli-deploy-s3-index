# Change Log

## [v1.0.0](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/tree/v1.0.0) (2017-03-31)
[Full Changelog](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/compare/v1.0.0-beta.1...v1.0.0)

No changes from beta.1

## [v1.0.0-beta.1](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/tree/v1.0.0-beta.1) (2017-03-31)
[Full Changelog](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/compare/v1.0.0-beta.0...v1.0.0-beta.1)

**Merged pull requests:**

- Add support for recusively listing all revisions in a bucket [\#71](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/71) ([vitch](https://github.com/vitch))

## [v1.0.0-beta.0](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/tree/v1.0.0-beta.0) (2017-03-25)
[Full Changelog](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/compare/v0.5.0...v1.0.0-beta.0)

**Merged pull requests:**

- Upgrade ember-cli & embrace being a node-only ember-cli addon [\#72](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/72) ([lukemelia](https://github.com/lukemelia))
- \[DOC\] Link to previewing revisions article [\#69](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/69) ([blimmer](https://github.com/blimmer))
- Add Server Side Encryption [\#67](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/67) ([sethpollack](https://github.com/sethpollack))
- Update config example to reflect required parameters [\#66](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/66) ([crhayes](https://github.com/crhayes))

## [v0.5.0](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/tree/v0.5.0) (2016-05-12)
[Full Changelog](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/compare/v0.4.0...v0.5.0)

**Merged pull requests:**

- Allow cache-control headers to be set by options [\#63](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/63) ([LevelbossMike](https://github.com/LevelbossMike))
- Upgrade ember-cli to 2.5.0 [\#62](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/62) ([LevelbossMike](https://github.com/LevelbossMike))

## [v0.4.0](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/tree/v0.4.0) (2016-04-01)
[Full Changelog](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/compare/v0.3.1...v0.4.0)

**Merged pull requests:**

- Take `filePattern` into account when determining `isGzipped` status [\#59](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/59) ([elidupuis](https://github.com/elidupuis))

## [v0.3.1](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/tree/v0.3.1) (2016-02-21)
[Full Changelog](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/compare/v0.3.0...v0.3.1)

**Merged pull requests:**

- Release v0.3.1 [\#57](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/57) ([LevelbossMike](https://github.com/LevelbossMike))
- Remove remaining `path.join` for win-compatibility [\#56](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/56) ([LevelbossMike](https://github.com/LevelbossMike))
- Add appveyor badge [\#55](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/55) ([LevelbossMike](https://github.com/LevelbossMike))
- Add appveyor for windows builds [\#53](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/53) ([LevelbossMike](https://github.com/LevelbossMike))
- Add tests for untested hooks [\#51](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/51) ([LevelbossMike](https://github.com/LevelbossMike))
- Update README to include Cloudfont pretty url config [\#50](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/50) ([jarredkenny](https://github.com/jarredkenny))
- Remove path.join on file upload key [\#43](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/43) ([twaggs](https://github.com/twaggs))
- Fix \#27: Conditionally add ContentEncoding:gzip header when index.html is gzipped [\#42](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/42) ([taylon](https://github.com/taylon))

## [v0.3.0](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/tree/v0.3.0) (2016-02-06)
[Full Changelog](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/compare/v0.2.0...v0.3.0)

**Merged pull requests:**

- add fetchInitialRevisions [\#47](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/47) ([ghedamat](https://github.com/ghedamat))
- Add mimetype detection based on `filePattern`/`filePath` [\#46](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/46) ([elidupuis](https://github.com/elidupuis))
- Ensure ACL configuration option is set during activation [\#44](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/44) ([elidupuis](https://github.com/elidupuis))
- update ember-cli-deploy-plugin [\#41](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/41) ([ghedamat](https://github.com/ghedamat))
- \[Doc\] Fix documentation passing revision via cli [\#39](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/39) ([LevelbossMike](https://github.com/LevelbossMike))
- Readme: Missing `=` in snippet [\#38](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/38) ([jthiller](https://github.com/jthiller))
- Useful info for AWS admins [\#37](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/37) ([pablobm](https://github.com/pablobm))
- Don't use path.join for URLs [\#36](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/36) ([LevelbossMike](https://github.com/LevelbossMike))

## [v0.2.0](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/tree/v0.2.0) (2015-12-31)
[Full Changelog](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/compare/v0.1.1...v0.2.0)

**Merged pull requests:**

- Add missing assignment [\#34](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/34) ([backspace](https://github.com/backspace))
- Loosen AWS option requirements [\#33](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/33) ([quiddle](https://github.com/quiddle))
- \[BREAKING\] Make `region` a required configuration. [\#31](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/31) ([LevelbossMike](https://github.com/LevelbossMike))
- Update to revision plugin information on readme [\#29](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/29) ([Jordan4jc](https://github.com/Jordan4jc))

## [v0.1.1](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/tree/v0.1.1) (2015-12-13)
[Full Changelog](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/compare/v0.1.0...v0.1.1)

**Merged pull requests:**

- update link to ember-cli-deploy-build [\#26](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/26) ([csantero](https://github.com/csantero))
- Add support for ACL on objects [\#24](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/24) ([flecno](https://github.com/flecno))
- Warn about configuration sharing [\#22](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/22) ([LevelbossMike](https://github.com/LevelbossMike))
- Fix quickstart instructions in README.md [\#17](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/17) ([LevelbossMike](https://github.com/LevelbossMike))

## [v0.1.0](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/tree/v0.1.0) (2015-10-25)
[Full Changelog](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/compare/v0.1.0-beta.1...v0.1.0)

**Merged pull requests:**

- Release 0.1.0 [\#14](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/14) ([LevelbossMike](https://github.com/LevelbossMike))
- Update to use new verbose option for logging [\#13](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/13) ([lukemelia](https://github.com/lukemelia))

## [v0.1.0-beta.1](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/tree/v0.1.0-beta.1) (2015-10-19)
**Merged pull requests:**

- Release v0.1.0-beta.1 [\#12](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/12) ([LevelbossMike](https://github.com/LevelbossMike))
- Add `allowOverwrite` option [\#11](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/11) ([LevelbossMike](https://github.com/LevelbossMike))
- Updating docs for new options [\#10](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/10) ([lpetre](https://github.com/lpetre))
- Add Travis badge [\#9](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/9) ([LevelbossMike](https://github.com/LevelbossMike))
- Add tests for lib/s3 [\#8](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/8) ([LevelbossMike](https://github.com/LevelbossMike))
- Large restructure of s3-index plugin [\#7](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/7) ([lpetre](https://github.com/lpetre))
- Handle the case where there is no current.json [\#5](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/5) ([lpetre](https://github.com/lpetre))
- Support passing a valid s3client via config [\#4](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/4) ([lpetre](https://github.com/lpetre))
- Added missing dependency [\#3](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/3) ([vitch](https://github.com/vitch))
- Added function keyword [\#2](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/2) ([vitch](https://github.com/vitch))
- \[WIP\] Retrieve revisionKey from revisionData [\#1](https://github.com/ember-cli-deploy/ember-cli-deploy-s3-index/pull/1) ([achambers](https://github.com/achambers))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*

## [2.4.0](https://github.com/keyshade-xyz/keyshade/compare/v2.3.0...v2.4.0) (2024-09-05)

### 🚀 Features

* **api-client:** Create controller for Event module ([#399](https://github.com/keyshade-xyz/keyshade/issues/399)) ([122df35](https://github.com/keyshade-xyz/keyshade/commit/122df351b551e88f0d854f6750faaef94f92e3de))
* **api-client:** Create controller for Integration module ([#397](https://github.com/keyshade-xyz/keyshade/issues/397)) ([697d38b](https://github.com/keyshade-xyz/keyshade/commit/697d38bbd32d7c025c233fd1724a31d34e56e50c))
* **api-client:** Create controller for Project module ([#370](https://github.com/keyshade-xyz/keyshade/issues/370)) ([fa25866](https://github.com/keyshade-xyz/keyshade/commit/fa25866cef5497620ab0af9ddc55d320c05050fe))
* **api-client:** Create controller for Secret module ([#396](https://github.com/keyshade-xyz/keyshade/issues/396)) ([7e929c0](https://github.com/keyshade-xyz/keyshade/commit/7e929c08a2e97d5518efef7c7671aa52068702ca))
* **api-client:** Create controller for Variable module ([#395](https://github.com/keyshade-xyz/keyshade/issues/395)) ([3e114d9](https://github.com/keyshade-xyz/keyshade/commit/3e114d9407e9a7243b1a24514e07a0b8ac939223))
* **api:** Add global search in workspace ([c49962b](https://github.com/keyshade-xyz/keyshade/commit/c49962bf1f4441e95dbcbf1e10520f66c60496bb))
* **api:** Add max page size ([#377](https://github.com/keyshade-xyz/keyshade/issues/377)) ([ed18eb0](https://github.com/keyshade-xyz/keyshade/commit/ed18eb0c846430f2263035431c851520f0cf6421))
* **cli:** Add functionality to operate on Environments ([#324](https://github.com/keyshade-xyz/keyshade/issues/324)) ([4c6f3f8](https://github.com/keyshade-xyz/keyshade/commit/4c6f3f8ba20363f598bb85a76a9c1ebb7e849bce))
* **cli:** Quit on decryption failure ([#381](https://github.com/keyshade-xyz/keyshade/issues/381)) ([1349d15](https://github.com/keyshade-xyz/keyshade/commit/1349d15b3879527876d41001bdb5d85c22d417ff))

### 🐛 Bug Fixes

* **api-client:** Fixed broken export ([096df2c](https://github.com/keyshade-xyz/keyshade/commit/096df2c4971570d093885f9be2392b14c65c4e7f))
* **api:** Add NotFound exception on passing an invalid roleId while inviting user in workspace ([#408](https://github.com/keyshade-xyz/keyshade/issues/408)) ([ab441db](https://github.com/keyshade-xyz/keyshade/commit/ab441dbd3f60f2deae36465653c7665296c453d7))
* **cli:** Fixed missing module ([f7a091f](https://github.com/keyshade-xyz/keyshade/commit/f7a091ff21ddef89d12b0208bba5e38e1549ffe6))
* **platform:**  Build failure in platform ([#385](https://github.com/keyshade-xyz/keyshade/issues/385)) ([90dcb2c](https://github.com/keyshade-xyz/keyshade/commit/90dcb2c6f6cb3d89705f4374e66a7f1dc098b0c2))

### 🔧 Miscellaneous Chores

* Add api client build script and updated CI ([da0e27a](https://github.com/keyshade-xyz/keyshade/commit/da0e27aab1f725adf28d60592e73818bb1584df7))
* **api:** Reorganized import using path alias ([d5befd1](https://github.com/keyshade-xyz/keyshade/commit/d5befd15a5324e217bff76ef834c4387f6a168ba))
* **ci:** Update CLI CI name ([8f4c456](https://github.com/keyshade-xyz/keyshade/commit/8f4c4563c7597b9910859670b28a51af186e2928))
* **cli:** Add Zod validation to parseInput function ([#362](https://github.com/keyshade-xyz/keyshade/issues/362)) ([34e6c39](https://github.com/keyshade-xyz/keyshade/commit/34e6c39bd6dea6a3f86d8c724d690b04bd6e2de4))
* Fixed api client tests and rearranged controllers ([1307604](https://github.com/keyshade-xyz/keyshade/commit/1307604661b662f2495c9ec1816d9e51219078c3))
* Housekeeping ([c5f1330](https://github.com/keyshade-xyz/keyshade/commit/c5f13306ede59f2c72c21256796387efb0262ca5))
* **platform:** Added strict null check ([072254f](https://github.com/keyshade-xyz/keyshade/commit/072254f20c05fe0f2b2d099787e0562dc806394a))
* **web:** Added strict null check ([7e12b47](https://github.com/keyshade-xyz/keyshade/commit/7e12b470e0310072c80da8ce7ee212bb75777779))

### 🔨 Code Refactoring

* **api:** Update logic for forking projects ([#398](https://github.com/keyshade-xyz/keyshade/issues/398)) ([4cf3838](https://github.com/keyshade-xyz/keyshade/commit/4cf38389e975977a85e28cce52b9f2b0ce795c1f))

## [2.3.0](https://github.com/keyshade-xyz/keyshade/compare/v2.2.0...v2.3.0) (2024-07-29)

### 🚀 Features

* **api:** Add pagination metadata to Environment module ([#382](https://github.com/keyshade-xyz/keyshade/issues/382)) ([9baa344](https://github.com/keyshade-xyz/keyshade/commit/9baa344e662e8034ab184f9db2218b8d8b279c61))
* **api:** Add pagination metadata to Event module ([#394](https://github.com/keyshade-xyz/keyshade/issues/394)) ([60010b4](https://github.com/keyshade-xyz/keyshade/commit/60010b434a15082b90b9b858e0dd9c09748661fb))
* **api:** Add pagination metadata to Integration module ([#391](https://github.com/keyshade-xyz/keyshade/issues/391)) ([0372e36](https://github.com/keyshade-xyz/keyshade/commit/0372e3629d4d96df7d7263215f866ad8a3e70bc0))
* **api:** Add pagination metadata to Project module ([#393](https://github.com/keyshade-xyz/keyshade/issues/393)) ([bc274fd](https://github.com/keyshade-xyz/keyshade/commit/bc274fdc241395c022fd6f209c0e951ab4c7694f))
* **api:** Add pagination metadata to Secret module ([#389](https://github.com/keyshade-xyz/keyshade/issues/389)) ([c4cc667](https://github.com/keyshade-xyz/keyshade/commit/c4cc6676f566c6216ba2e196834aea164c682e51))
* **api:** Add pagination metadata to Variable module ([#390](https://github.com/keyshade-xyz/keyshade/issues/390)) ([be6aabf](https://github.com/keyshade-xyz/keyshade/commit/be6aabfe218b039d65b62aa01518240487bb5836))
* **api:** Add pagination metadata to Workspace module  ([#387](https://github.com/keyshade-xyz/keyshade/issues/387)) ([a08c924](https://github.com/keyshade-xyz/keyshade/commit/a08c924dbc52ea45e793d639170333f8824eae2c))
* **api:** Add pagination metadata to Workspace Role module ([#388](https://github.com/keyshade-xyz/keyshade/issues/388)) ([d8e8f49](https://github.com/keyshade-xyz/keyshade/commit/d8e8f491d966cb794057536922c7469ed4f8f448))
* **api:** Create a paginate method ([#379](https://github.com/keyshade-xyz/keyshade/issues/379)) ([09576f1](https://github.com/keyshade-xyz/keyshade/commit/09576f130900ea8d89454332bef9353bfe09a0b2))
* **api:** Create endpoint for fetching all revisions of a [secure] ([#303](https://github.com/keyshade-xyz/keyshade/issues/303)) ([de2b602](https://github.com/keyshade-xyz/keyshade/commit/de2b602dcd5bdab104d910b12761a6ec778103b8))
* **api:** Create endpoint for fetching all revisions of a variable ([#304](https://github.com/keyshade-xyz/keyshade/issues/304)) ([9abddc1](https://github.com/keyshade-xyz/keyshade/commit/9abddc11691146045e727078b3b963f8b9c2e990))
* **cli:** Improved the DX for list profile ([#334](https://github.com/keyshade-xyz/keyshade/issues/334)) ([6bff496](https://github.com/keyshade-xyz/keyshade/commit/6bff4964493f9919b221a5dc6fcc578bc47b2832))
* **platform:** Add warning sonner toast for invalid otp ([#335](https://github.com/keyshade-xyz/keyshade/issues/335)) ([21513f5](https://github.com/keyshade-xyz/keyshade/commit/21513f5be6d36b308cd5926e7ad1b475f96cb668))

### 🐛 Bug Fixes

* **cli:** Added parent directory check ([#359](https://github.com/keyshade-xyz/keyshade/issues/359)) ([538ea7f](https://github.com/keyshade-xyz/keyshade/commit/538ea7f2654e4f3ea06fde9fe653342ca769ce44))
* **platform:** Platform types fixes ([#374](https://github.com/keyshade-xyz/keyshade/issues/374)) ([8e9d9ff](https://github.com/keyshade-xyz/keyshade/commit/8e9d9ffac0af1f93bb5513bf94aa3a75fb3c31c6))

### 📚 Documentation

* Added docker details in setting-things-up.md ([#358](https://github.com/keyshade-xyz/keyshade/issues/358)) ([ed5093a](https://github.com/keyshade-xyz/keyshade/commit/ed5093ac5df17f8dbf4c7e286af739121b51a692))
* Update postman workspace link ([d6aba27](https://github.com/keyshade-xyz/keyshade/commit/d6aba270a97f03f16e35b5cde75ff472641fe1a7))
* Updated env and cli docs ([1213d2a](https://github.com/keyshade-xyz/keyshade/commit/1213d2a9b5689d44a260eff9c2e0eb8e6968c7da))

### 🔧 Miscellaneous Chores

* Added next backend url in .env.example ([5695254](https://github.com/keyshade-xyz/keyshade/commit/5695254b64d3c504f7ca7cd17681f42947fef232))
* **api-client:** Added pagination structure ([a70e957](https://github.com/keyshade-xyz/keyshade/commit/a70e957afc828be1e72d0ea958de8ba860a04b9c))
* **api-client:** Fixed test script ([ad70819](https://github.com/keyshade-xyz/keyshade/commit/ad708190771f40596646b54fdda49a01c4742644))
* **api-client:** Removed try-catch from tests in environment ([a64e48c](https://github.com/keyshade-xyz/keyshade/commit/a64e48cb171b3996bddb74f2cf256d4760e3ccb3))
* **api:** Add user cache for optimization ([#386](https://github.com/keyshade-xyz/keyshade/issues/386)) ([8d730b5](https://github.com/keyshade-xyz/keyshade/commit/8d730b58830a8a0e6be6bf0fe86b3021a2d473eb))
* **api:** Alter cache rehydration interval ([f5f9eec](https://github.com/keyshade-xyz/keyshade/commit/f5f9eec5c81b29d7f8eb1e233c4e80e4d36eb0cf))
* **api:** Fixed naming error in variable controller ([0c5a380](https://github.com/keyshade-xyz/keyshade/commit/0c5a380fba843a2eb8a84753cfbe8b3ef86b6e31))
* **api:** Improve handling of edge cases for paginate module ([#402](https://github.com/keyshade-xyz/keyshade/issues/402)) ([8591487](https://github.com/keyshade-xyz/keyshade/commit/8591487623c5e817ff31aedd6e8cd15074bcfc1c))
* **api:** Minor updates to user service ([249d778](https://github.com/keyshade-xyz/keyshade/commit/249d778b94a5587b6c7da6d7afe04b9bfee5c0d6))
* **api:** Skip workspace creation when user is admin ([#376](https://github.com/keyshade-xyz/keyshade/issues/376)) ([13f6c59](https://github.com/keyshade-xyz/keyshade/commit/13f6c59fda07e4a8b6f991e670ab055964fb2fb1))
* **ci:** Add docker check   ([#383](https://github.com/keyshade-xyz/keyshade/issues/383)) ([3119001](https://github.com/keyshade-xyz/keyshade/commit/311900177b85035d777acb6d86549cfffc71dbef))
* **ci:** Add names to CI files ([1a7e5f6](https://github.com/keyshade-xyz/keyshade/commit/1a7e5f6c2b4e4a5aced5955a2a394f0540776cb1))
* **ci:** Add validate CLI pipeline ([#373](https://github.com/keyshade-xyz/keyshade/issues/373)) ([a91df6c](https://github.com/keyshade-xyz/keyshade/commit/a91df6c6eedbb3e79dd77cbe42ca4836a714e8a3))
* **ci:** Adding validate pipeline ([#372](https://github.com/keyshade-xyz/keyshade/issues/372)) ([23cf3b3](https://github.com/keyshade-xyz/keyshade/commit/23cf3b3b12719297ac00c07a20d0b57462440fef))
* **ci:** Disabled platform and api deployments ([74d601a](https://github.com/keyshade-xyz/keyshade/commit/74d601a576986f6436314dd6631f86ee49185109))
* **ci:** Fixed deployment scripts ([12e35db](https://github.com/keyshade-xyz/keyshade/commit/12e35db8a5d454db59c8eadaa6bd0fa0525b90b5))
* **ci:** Fixed platform script ([d783f2a](https://github.com/keyshade-xyz/keyshade/commit/d783f2ab16c63c711a8022b145e0af085cc011de))
* **CI:** Include migration deployment in API deploy pipeline ([dbd5222](https://github.com/keyshade-xyz/keyshade/commit/dbd5222a5081d769e47cd32231cc515bb311666b))
* **CI:** Separated deployment and docker build jobs ([090e193](https://github.com/keyshade-xyz/keyshade/commit/090e193cb4af3771e523dd371364f2d21dd3cd03))
* **CI:** Setup inter-job dependency ([1756727](https://github.com/keyshade-xyz/keyshade/commit/1756727849a2bfabf9d58a81e95d7b6f6c159f4a))
* **ci:** Update auto-assign.yaml ([#375](https://github.com/keyshade-xyz/keyshade/issues/375)) ([91e0ec1](https://github.com/keyshade-xyz/keyshade/commit/91e0ec12da8c22b8b2ecec8a35aef48fc5fecc9d))
* **cli:** Changed objects to classes ([#306](https://github.com/keyshade-xyz/keyshade/issues/306)) ([c83f2db](https://github.com/keyshade-xyz/keyshade/commit/c83f2db56ddc3256ed4df35169325cc5427b4978))
* Removed Minio config ([8feb83a](https://github.com/keyshade-xyz/keyshade/commit/8feb83aae23b5817d5038235a3d0e59c5d12a0ff))
* Updated deployment scripts and added health check in platform ([fcc1c3f](https://github.com/keyshade-xyz/keyshade/commit/fcc1c3fb50679073c7d3791fedafe25b1287ad0a))

### 🔨 Code Refactoring

* **api:** Updated path of some endpoints in project controller ([9502678](https://github.com/keyshade-xyz/keyshade/commit/95026787df5156147a209c7f6e6b8970b33df5aa))
* **api:** Updated Redis provider ([33491a1](https://github.com/keyshade-xyz/keyshade/commit/33491a199c5ae7f822e44936eebab964f7f93ac5))

## [2.2.0](https://github.com/keyshade-xyz/keyshade/compare/v2.1.0...v2.2.0) (2024-07-11)

### 🚀 Features

* **api-client:** Added API Client package ([#346](https://github.com/keyshade-xyz/keyshade/issues/346)) ([6734e1e](https://github.com/keyshade-xyz/keyshade/commit/6734e1e2490915406a82c2e5a6bd88944b0fb664))
* **api:** Updated API key ([fbac312](https://github.com/keyshade-xyz/keyshade/commit/fbac3120b4aa063119f3b09a2b61996fefb17143))
* **platform:** View [secure]s ([#313](https://github.com/keyshade-xyz/keyshade/issues/313)) ([97c4541](https://github.com/keyshade-xyz/keyshade/commit/97c45414d4a3e456170369c07d4f936f06189c7a))
* **web:** Add Pricing Page ([#243](https://github.com/keyshade-xyz/keyshade/issues/243)) ([2c7f1d6](https://github.com/keyshade-xyz/keyshade/commit/2c7f1d6171ac0563a13279676ddaf3d098855fee))

### 📚 Documentation

* **cli:** Added docs for the CLI package ([#329](https://github.com/keyshade-xyz/keyshade/issues/329)) ([edad166](https://github.com/keyshade-xyz/keyshade/commit/edad166c1a05507da481158f42571d1724179e36))
* **cli:** Added usage docs ([#330](https://github.com/keyshade-xyz/keyshade/issues/330)) ([b6963d5](https://github.com/keyshade-xyz/keyshade/commit/b6963d5093f9031cd76821eb5faab840ea979d53))
* Update Discord link ([871b6cd](https://github.com/keyshade-xyz/keyshade/commit/871b6cdef19fed55d7b34bc1e8b418b6974e9f38))
* Update README.md ([e66fcd2](https://github.com/keyshade-xyz/keyshade/commit/e66fcd2caf75f75cd3a195139e92c5b27a7321ef))
* **web:** Add documentation about our web package ([#268](https://github.com/keyshade-xyz/keyshade/issues/268)) ([3d848e7](https://github.com/keyshade-xyz/keyshade/commit/3d848e7e2e20623edcc6c8dec3741f2de506c2c5))

### 🔧 Miscellaneous Chores

* **api:** Updated response types in environment service ([b8a3ddd](https://github.com/keyshade-xyz/keyshade/commit/b8a3ddd5c2c1f8a9c24f7df6f193eff4fc2da691))
* **ci:** Added release scripts for platform and api ([02dae60](https://github.com/keyshade-xyz/keyshade/commit/02dae60f1b5493e820b71e1640c6aec73d5d00f8))
* **CI:** Updated action plugin versions ([88bb317](https://github.com/keyshade-xyz/keyshade/commit/88bb3171e44e068f7ea848dcff7f927b8e2df92b))
* **CI:** Updated pnpm version in CI file ([2692e88](https://github.com/keyshade-xyz/keyshade/commit/2692e887144b3ed6108e8b2b7670f1bfc9f79fcf))
* **platform:** Fixed env parsing in platform ([d6ffafa](https://github.com/keyshade-xyz/keyshade/commit/d6ffafa16eaea7131af0356a9fc2a4107e7cdddc))
* **web:** Update Terms and Conditions and Privacy Policy ([#282](https://github.com/keyshade-xyz/keyshade/issues/282)) ([d621dcb](https://github.com/keyshade-xyz/keyshade/commit/d621dcb2675caf6cf12f07f9fdd48cc57d581a62))

### 🔨 Code Refactoring

* **api:** Update [secure] and variable fetching endpoints ([7d9acd0](https://github.com/keyshade-xyz/keyshade/commit/7d9acd03bed944fb99a630c2ee519e2f71354716))
* **cli:** Refactored profile commands into readable blocks ([#331](https://github.com/keyshade-xyz/keyshade/issues/331)) ([4a8a089](https://github.com/keyshade-xyz/keyshade/commit/4a8a089dddd51cb04718f436d52735f48e55cceb))
* **cli:** Updated configuration commands and mechanism ([#310](https://github.com/keyshade-xyz/keyshade/issues/310)) ([9079b6d](https://github.com/keyshade-xyz/keyshade/commit/9079b6d05667363312deae47754e2adc72a1ca73))

## [2.1.0](https://github.com/keyshade-xyz/keyshade/compare/v2.0.0...v2.1.0) (2024-06-27)

### 🚀 Features

* **api:** Add `requireRestart` parameter ([#286](https://github.com/keyshade-xyz/keyshade/issues/286)) ([fb447a1](https://github.com/keyshade-xyz/keyshade/commit/fb447a1852a95dcacfdb0aa896fd1521430fa095))
* **cli:** Added CLI ([#289](https://github.com/keyshade-xyz/keyshade/issues/289)) ([1143d95](https://github.com/keyshade-xyz/keyshade/commit/1143d9547705808230b3cbcf81a3ff2a8604eaa2))
* **workflows:** Tag user on attempt's reply body ([9d01698](https://github.com/keyshade-xyz/keyshade/commit/9d0169881d9ba7a0d84cee6d4de0e5e9c7c1e6ad))

### 🐛 Bug Fixes

* **web:** Resolve encryption glitch in footer text  ([#267](https://github.com/keyshade-xyz/keyshade/issues/267)) ([2b5cb39](https://github.com/keyshade-xyz/keyshade/commit/2b5cb39351d7412002514fd5a7ee6f75e02006aa))

### 📚 Documentation

* added running-the-web-app.md ([#269](https://github.com/keyshade-xyz/keyshade/issues/269)) ([755ea12](https://github.com/keyshade-xyz/keyshade/commit/755ea120ae90e62aaaf6b5dccf62d1d633b38c46))

## [2.0.0](https://github.com/keyshade-xyz/keyshade/compare/v1.4.0...v2.0.0) (2024-06-12)

### ⚠ BREAKING CHANGES

* **api:** Refactor environment, [secure] and variable functionality

### 🚀 Features

* **platform:** Workspace integrate ([#241](https://github.com/keyshade-xyz/keyshade/issues/241)) ([6107e7d](https://github.com/keyshade-xyz/keyshade/commit/6107e7dd14c1e167a1a12f1c4b189e73f01dde88))

### 📚 Documentation

* Fix broken links in README.md ([9266788](https://github.com/keyshade-xyz/keyshade/commit/92667881bbce4d0c2cce186178806054d998808a))
* Modified environment-variable.md ([#256](https://github.com/keyshade-xyz/keyshade/issues/256)) ([4974756](https://github.com/keyshade-xyz/keyshade/commit/497475600467e039745a695a6e69635cebd8f8da))

### 🔧 Miscellaneous Chores

* Added docker build and run commands to` package.json` ([#258](https://github.com/keyshade-xyz/keyshade/issues/258)) ([af61791](https://github.com/keyshade-xyz/keyshade/commit/af61791b18b827de8369cbeac51a22a93ce8be2e))
* **api:** Fix inconsistencies in zod schema ([#240](https://github.com/keyshade-xyz/keyshade/issues/240)) ([f3a3632](https://github.com/keyshade-xyz/keyshade/commit/f3a36326b4f5c945fb2725620ff92ab31e44e053))
* **ci:** Update deploy web ([e80d47d](https://github.com/keyshade-xyz/keyshade/commit/e80d47dbf93699ba5c9296ee0e5029397e0f215b))
* **docker:** Grant correct permissions to docker image ([#251](https://github.com/keyshade-xyz/keyshade/issues/251)) ([49546aa](https://github.com/keyshade-xyz/keyshade/commit/49546aa5b0ad6e3ec3b9679e79e96ee0608f8c74))
* Update GitHub Action plugin versions  ([#263](https://github.com/keyshade-xyz/keyshade/issues/263)) ([020bbf6](https://github.com/keyshade-xyz/keyshade/commit/020bbf642335fb98db59e83ec722f24490f36d03))
* Update package versions for release ([93785be](https://github.com/keyshade-xyz/keyshade/commit/93785be23dfd168ea3d2c85390c51e0649e9ee9e))

### 🔨 Code Refactoring

* **api:** Refactor environment, [secure] and variable functionality ([#270](https://github.com/keyshade-xyz/keyshade/issues/270)) ([55a6d37](https://github.com/keyshade-xyz/keyshade/commit/55a6d3727e670957b61183bac741b132fcad800f))
* **api:** Replace for loop with array indexing while decrypting [secure]s during bulk fetch [#265](https://github.com/keyshade-xyz/keyshade/issues/265) ([#266](https://github.com/keyshade-xyz/keyshade/issues/266)) ([62a1731](https://github.com/keyshade-xyz/keyshade/commit/62a173111afd40dfa2c5f52e0def086cf5156fc0))
* **api:** Update return type while fetching [secure]s and variables ([#264](https://github.com/keyshade-xyz/keyshade/issues/264)) ([fd36abd](https://github.com/keyshade-xyz/keyshade/commit/fd36abd31ab4b2020e4b3e76bf5a155c6e56bb09))

## [1.4.0](https://github.com/keyshade-xyz/keyshade/compare/v1.3.0...v1.4.0) (2024-05-24)


### 🚀 Features

* add example for health and email auth ([b834d25](https://github.com/keyshade-xyz/keyshade/commit/b834d254a8d9bc506021b8ab07b6e94c80997b9f))
* **api:** Add `minio-client` provider ([#237](https://github.com/keyshade-xyz/keyshade/issues/237)) ([cd71c5a](https://github.com/keyshade-xyz/keyshade/commit/cd71c5aae15711ab7309069cf6416d0b25eed9e7))
* **api:** Add feature to fork projects ([#239](https://github.com/keyshade-xyz/keyshade/issues/239)) ([3bab653](https://github.com/keyshade-xyz/keyshade/commit/3bab653eb801fa561cd9f3c7c375ba32dda00c36))
* **api:** Added feedback form module ([#210](https://github.com/keyshade-xyz/keyshade/issues/210)) ([ae1efd8](https://github.com/keyshade-xyz/keyshade/commit/ae1efd8a9a3437ed8d3955e6091f4f50d0596f39))
* **api:** Added Project Level Access  ([#221](https://github.com/keyshade-xyz/keyshade/issues/221)) ([564f5ed](https://github.com/keyshade-xyz/keyshade/commit/564f5ed52672dc1e7c47c67c60af9cb142594a8a))
* **api:** Added support for changing email of users ([#233](https://github.com/keyshade-xyz/keyshade/issues/233)) ([5ea9a10](https://github.com/keyshade-xyz/keyshade/commit/5ea9a10d1972cf6865faa0c051ed9de595eb6d47))
* implemented auth, ui for most, and fixed cors ([#217](https://github.com/keyshade-xyz/keyshade/issues/217)) ([feace86](https://github.com/keyshade-xyz/keyshade/commit/feace865d60442fea96b5074e16d0d0f48792aa9))
* **platfrom:** add delete method in api client ([#225](https://github.com/keyshade-xyz/keyshade/issues/225)) ([55cf09f](https://github.com/keyshade-xyz/keyshade/commit/55cf09f7d9c977b7ab5e1a832ea82fd94b7f9984))
* **postman:** add example for get_self and update_self ([e015acf](https://github.com/keyshade-xyz/keyshade/commit/e015acfdca0f694898f27d49ffd447b70faee215))
* **web:** Add and link privacy and tnc page ([#226](https://github.com/keyshade-xyz/keyshade/issues/226)) ([ec81eb9](https://github.com/keyshade-xyz/keyshade/commit/ec81eb919d9370ff3772ed2732f30a0f9ac74be8))


### 🐛 Bug Fixes

* **web:** docker next config not found ([#228](https://github.com/keyshade-xyz/keyshade/issues/228)) ([afe3160](https://github.com/keyshade-xyz/keyshade/commit/afe3160d5c25db863e40000d2c4b82ccb82978aa))


### 📚 Documentation

* Added docs regarding postman, and refactored architecture diagrams ([f1c9777](https://github.com/keyshade-xyz/keyshade/commit/f1c9777e037bcf7f627624f5ca2a46b087b4a6af))
* Fix typo in organization-of-code.md ([#234](https://github.com/keyshade-xyz/keyshade/issues/234)) ([11244a2](https://github.com/keyshade-xyz/keyshade/commit/11244a26b26c915d3bdd62b4ef93b505a274f35b))


### 🔧 Miscellaneous Chores

* **api:** Get feedback forward email from process.env ([#236](https://github.com/keyshade-xyz/keyshade/issues/236)) ([204c9d1](https://github.com/keyshade-xyz/keyshade/commit/204c9d133df04fb93f965cdb58ea948bcf44df12))
* **postman:** Initialized postman ([bb76384](https://github.com/keyshade-xyz/keyshade/commit/bb763842a4ab3ba0aa199c6837f6e45c8f900a59))
* **release:** Update changelog config ([af91283](https://github.com/keyshade-xyz/keyshade/commit/af912831d260a0bc3e7cc9e07ed5a19d4534395d))
* Remove swagger docs ([#220](https://github.com/keyshade-xyz/keyshade/issues/220)) ([7640299](https://github.com/keyshade-xyz/keyshade/commit/76402998fb148b147ec116a17aeb4c1f0b46b7d2))


### 🔨 Code Refactoring

* **api:** Replaced OTP code from alphanumeric to numeric ([#230](https://github.com/keyshade-xyz/keyshade/issues/230)) ([f16162a](https://github.com/keyshade-xyz/keyshade/commit/f16162a6b3c076f1f84c4432cf1b0ed238138550))

## [1.3.0](https://github.com/keyshade-xyz/keyshade/compare/v1.2.0...v1.3.0) (2024-05-12)


### 🚀 Features

* Add approval support ([#158](https://github.com/keyshade-xyz/keyshade/issues/158)) ([e09ae60](https://github.com/keyshade-xyz/keyshade/commit/e09ae60f48c2339c2000af2f45b3e07db2780f41))
* **api:** Add configuration live update support ([#181](https://github.com/keyshade-xyz/keyshade/issues/181)) ([f7d6684](https://github.com/keyshade-xyz/keyshade/commit/f7d668449bfe84286ef973eb1751a2b6c377f2ba))
* **api:** Add feature to export data of a workspace ([#152](https://github.com/keyshade-xyz/keyshade/issues/152)) ([46833aa](https://github.com/keyshade-xyz/keyshade/commit/46833aa8bd4362cfdf08817d2faaf2a8e8bdeb99))
* **api:** Add Integration support ([#203](https://github.com/keyshade-xyz/keyshade/issues/203)) ([f1ae87e](https://github.com/keyshade-xyz/keyshade/commit/f1ae87ecca47e74ab4897f6e5d1c2457abd18a51))
* **api:** Add note to [secure] and variable ([#151](https://github.com/keyshade-xyz/keyshade/issues/151)) ([2e62351](https://github.com/keyshade-xyz/keyshade/commit/2e6235104c6cfeb29889a3c9beee81b893b9a26d))
* **api:** Add OAuth redirection and polished authentication ([#212](https://github.com/keyshade-xyz/keyshade/issues/212)) ([d2968bc](https://github.com/keyshade-xyz/keyshade/commit/d2968bc3122338599031f3671bbcd3a17b0b5129))
* **api:** Add support for storing and managing variables ([#149](https://github.com/keyshade-xyz/keyshade/issues/149)) ([963a8ae](https://github.com/keyshade-xyz/keyshade/commit/963a8ae529ddee8716b6a688e272dd635cfeaafd))
* **api:** Added GitLab OAuth ([#188](https://github.com/keyshade-xyz/keyshade/issues/188)) ([4d3bbe4](https://github.com/keyshade-xyz/keyshade/commit/4d3bbe482e84025201e4a02b7da3ded4972fcd9a))
* **api:** Added validation for reason field ([#190](https://github.com/keyshade-xyz/keyshade/issues/190)) ([90b8ff2](https://github.com/keyshade-xyz/keyshade/commit/90b8ff20fa47799bf7267ba45a3deae70f234d9e))
* **api:** Create default workspace on user's creation ([#182](https://github.com/keyshade-xyz/keyshade/issues/182)) ([3dc0c4c](https://github.com/keyshade-xyz/keyshade/commit/3dc0c4c95b6dd0a484806fdf0757754ce58a7200))
* **api:** Reading `port` Dynamically ([#170](https://github.com/keyshade-xyz/keyshade/issues/170)) ([fd46e3e](https://github.com/keyshade-xyz/keyshade/commit/fd46e3e2d37bf90572d2c9c7ec0b042e644878e0))
* **auth:** Add Google OAuth ([#156](https://github.com/keyshade-xyz/keyshade/issues/156)) ([cf387ea](https://github.com/keyshade-xyz/keyshade/commit/cf387eade9fd72d6894bb5375d791bc722040f00))
* **web:** Added waitlist ([#168](https://github.com/keyshade-xyz/keyshade/issues/168)) ([1084c77](https://github.com/keyshade-xyz/keyshade/commit/1084c772199382ee56cb3c515032ae1cc05d211b))
* **web:** Landing revamp ([#165](https://github.com/keyshade-xyz/keyshade/issues/165)) ([0bc723b](https://github.com/keyshade-xyz/keyshade/commit/0bc723b5c71f7db0c2ab6e99a6ffe5e49cfd0e3d))


### 🐛 Bug Fixes

* **web:** alignment issue in “Collaboration made easy” section ([#178](https://github.com/keyshade-xyz/keyshade/issues/178)) ([df5ca75](https://github.com/keyshade-xyz/keyshade/commit/df5ca75471e7bdf611406d76b276e05fccb36db0))
* **workspace:** delete duplicate tailwind config ([99d922a](https://github.com/keyshade-xyz/keyshade/commit/99d922ac185474435303efd4613daeb251de4bf4))


### 📚 Documentation

* add contributor list ([f37569a](https://github.com/keyshade-xyz/keyshade/commit/f37569a21091e5cd4b982b588096cc9e116e33a9))
* Add integration docs ([#204](https://github.com/keyshade-xyz/keyshade/issues/204)) ([406ddb7](https://github.com/keyshade-xyz/keyshade/commit/406ddb7e25198d98e8bf60e4b0273f05dc47435d))
* Added integration docs to gitbook summary ([ab37530](https://github.com/keyshade-xyz/keyshade/commit/ab375309fc93218355d1ab12aefa20377c04604c))
* **api:** Add swagger docs of API key controller ([#167](https://github.com/keyshade-xyz/keyshade/issues/167)) ([2910476](https://github.com/keyshade-xyz/keyshade/commit/2910476ce1fcf35abf1d6d196ec34811b7f1d943))
* **api:** Add swagger docs of User Controller ([#166](https://github.com/keyshade-xyz/keyshade/issues/166)) ([fd59522](https://github.com/keyshade-xyz/keyshade/commit/fd5952227663a68393ef5a3a10bcc9faca1683b9))
* fix typo in environment-variables.md ([#163](https://github.com/keyshade-xyz/keyshade/issues/163)) ([48294c9](https://github.com/keyshade-xyz/keyshade/commit/48294c978df805a0543dd05375d07aafa43e31c4))
* Remove supabase from docs ([#169](https://github.com/keyshade-xyz/keyshade/issues/169)) ([eddbce8](https://github.com/keyshade-xyz/keyshade/commit/eddbce81fe11cca8e3e759aac1524b185e1c18f8))
* **setup:** replace NX with Turbo in setup instructions ([#175](https://github.com/keyshade-xyz/keyshade/issues/175)) ([af8a460](https://github.com/keyshade-xyz/keyshade/commit/af8a460690b17e68b204d734a94705a61183b64d))
* Update README.md ([b59f16b](https://github.com/keyshade-xyz/keyshade/commit/b59f16beead8b7a549182e41abba90592f31a8cb))
* Update running-the-api.md ([177dbbf](https://github.com/keyshade-xyz/keyshade/commit/177dbbf9e7737246acf3a4c241688e3a000ce66f))
* Update running-the-api.md ([#193](https://github.com/keyshade-xyz/keyshade/issues/193)) ([3d5bcac](https://github.com/keyshade-xyz/keyshade/commit/3d5bcac76d5c5f64b13eb0f8e7bbd14a3101e322))


### 🔧 Miscellaneous Chores

* Added lockfile ([60a3b9b](https://github.com/keyshade-xyz/keyshade/commit/60a3b9bbc643beb0af1f6ec4dd7861944c6a1547))
* Added lockfile ([6bb512c](https://github.com/keyshade-xyz/keyshade/commit/6bb512c2e4ae2dd3bbdaecd2dc51c308772bbd84))
* **api:** Added type inference and runtime validation to `process.env` ([#200](https://github.com/keyshade-xyz/keyshade/issues/200)) ([249e07d](https://github.com/keyshade-xyz/keyshade/commit/249e07d9b7d6ac699f4a2167eb5b4c3068acb4db))
* **api:** Fixed prisma script env errors ([#209](https://github.com/keyshade-xyz/keyshade/issues/209)) ([8762354](https://github.com/keyshade-xyz/keyshade/commit/8762354f1f70e48614655d10760440cb7d7e60d9))
* **API:** Refactor authority check functions in API ([#189](https://github.com/keyshade-xyz/keyshade/issues/189)) ([e9d710d](https://github.com/keyshade-xyz/keyshade/commit/e9d710d49a872f6c3ca974780bcf1039f31104de))
* **api:** Refactor user e2e tests ([b38d45a](https://github.com/keyshade-xyz/keyshade/commit/b38d45a4314257030cc3bbcd90dd02cfd3574469))
* **ci:** Disabled api stage release ([97877c4](https://github.com/keyshade-xyz/keyshade/commit/97877c4116d88ecd633345aede552b369a03cea7))
* **ci:** Update stage deployment config ([868a6a1](https://github.com/keyshade-xyz/keyshade/commit/868a6a105563f8da2e57c97c29e9ad08700cf01b))
* **codecov:** update api-e2e project coverage ([1e90d7e](https://github.com/keyshade-xyz/keyshade/commit/1e90d7e1356ebbd084a31e220a7c910fa52820b3))
* **dockerfile:** Fixed web dockerfile ([6134bb2](https://github.com/keyshade-xyz/keyshade/commit/6134bb214dad37ba074eb0183eec325dcc4586f2))
* **docker:** Optimized web Dockerfile to reduct image size ([#173](https://github.com/keyshade-xyz/keyshade/issues/173)) ([444286a](https://github.com/keyshade-xyz/keyshade/commit/444286a70a94ae1d14cfb63614f0bd9317f032e2))
* **release:** Downgraded package version ([c173fee](https://github.com/keyshade-xyz/keyshade/commit/c173fee2bb3799b1a696f8cfeed863b6b2bcf8b4))
* **release:** Fix failing release ([#213](https://github.com/keyshade-xyz/keyshade/issues/213)) ([40f64f3](https://github.com/keyshade-xyz/keyshade/commit/40f64f35f01994d6d17e7d72e4d3ebd6d3a0431a))
* **release:** Install pnpm ([1081bea](https://github.com/keyshade-xyz/keyshade/commit/1081beafc669c38a92774d6da78ee4120e6ba8ed))
* **release:** Updated release commit ([b8958e7](https://github.com/keyshade-xyz/keyshade/commit/b8958e7e4929a128f9468ff598296b6c57ee357c))
* **release:** Updated release commit ([e270eb8](https://github.com/keyshade-xyz/keyshade/commit/e270eb8a5b7779116a36cb9a6bf7162c12b61229))
* Update deprecated husky Install command ([#202](https://github.com/keyshade-xyz/keyshade/issues/202)) ([e61102c](https://github.com/keyshade-xyz/keyshade/commit/e61102cb549b107354d59508d487b358a80742b9))
* Upgrade @million/lint from 0.0.66 to 0.0.73 ([#172](https://github.com/keyshade-xyz/keyshade/issues/172)) ([dd43ed9](https://github.com/keyshade-xyz/keyshade/commit/dd43ed9c37e3694b7869b9cd21c3f395f1b53d50))
* **web:** Updated fly memory config ([4debc66](https://github.com/keyshade-xyz/keyshade/commit/4debc668c8421347e1bec8b6a7238f22476a4e58))


### 🔨 Code Refactoring

* **api:** Made events central to workspace ([#159](https://github.com/keyshade-xyz/keyshade/issues/159)) ([9bc00ae](https://github.com/keyshade-xyz/keyshade/commit/9bc00ae0d3b0e576c72816438a4654dbfb631899))
* **api:** Migrated to cookie based authentication ([#206](https://github.com/keyshade-xyz/keyshade/issues/206)) ([ad6911f](https://github.com/keyshade-xyz/keyshade/commit/ad6911f530bec4c345be2b492efd873e0b5d9e33))
* **monorepo:** Migrate from nx to turbo ([#153](https://github.com/keyshade-xyz/keyshade/issues/153)) ([88b4b00](https://github.com/keyshade-xyz/keyshade/commit/88b4b00f7795348a182f5076b6b06c973e71eb3e))

## [1.2.0](https://github.com/keyshade-xyz/keyshade/compare/v1.1.0...v1.2.0) (2024-02-18)


### 🚀 Features

* **api:** Add Sentry Integeration ([#133](https://github.com/keyshade-xyz/keyshade/issues/133)) ([5ae2c92](https://github.com/keyshade-xyz/keyshade/commit/5ae2c92648dffb5f957ac3fb17812bfb504ded4d))


### 🔧 Miscellaneous Chores

* **api:** update dockerfile and ci ([ae2d944](https://github.com/keyshade-xyz/keyshade/commit/ae2d9441ab9d73ea61e5924a6157da7260aaf9c7))
* **api:** update sentry log messages ([976026c](https://github.com/keyshade-xyz/keyshade/commit/976026c74f2f1e7de7cab284b751ea87a8ce573d))
* **ci:** update stage-api workflow ([addaa61](https://github.com/keyshade-xyz/keyshade/commit/addaa61b5fd93af9e78854c254bf3874b8a73911))
* **husky:** Remove `e2e:api` command from husky ([#144](https://github.com/keyshade-xyz/keyshade/issues/144)) ([8a2fa58](https://github.com/keyshade-xyz/keyshade/commit/8a2fa5872d46b10bd820cc4188b4a5b11e23ff8c))
* update sentry source map script ([bdc9dc6](https://github.com/keyshade-xyz/keyshade/commit/bdc9dc684e4f4e6885a8a6f41fc20f9c5650f9b1))

## [1.1.0](https://github.com/keyshade-xyz/keyshade/compare/v1.0.0...v1.1.0) (2024-02-12)


### 🚀 Features

* **api:** add event ([#115](https://github.com/keyshade-xyz/keyshade/issues/115)) ([19e6603](https://github.com/keyshade-xyz/keyshade/commit/19e6603341fb7d4d0f752d1c3b3c02695f25ab25))


### 🔧 Miscellaneous Chores

* **ci:** CI rework ([788c141](https://github.com/keyshade-xyz/keyshade/commit/788c1417a2b43969f7810a3e7e9b3793f90c7fbe))
* **ci:** update CI of web and API ([bd171da](https://github.com/keyshade-xyz/keyshade/commit/bd171da5cb5fa8a23f022e2dbb5c199c3101ca71))
* **husky:** Update precommit ([b170cf3](https://github.com/keyshade-xyz/keyshade/commit/b170cf309e3ddcdc13f03d9eb6c4222cf1b02ecf))
* migrate from supabase to postgresql ([#129](https://github.com/keyshade-xyz/keyshade/issues/129)) ([e1ff912](https://github.com/keyshade-xyz/keyshade/commit/e1ff912fc5149f1249bcfa7a199d2dbdf080eb46))
* update CI ([32eb820](https://github.com/keyshade-xyz/keyshade/commit/32eb82006e61115f5b9f42cf82dd7f6fe09ca041))
* Update release config in package.json ([71c75a7](https://github.com/keyshade-xyz/keyshade/commit/71c75a71b695f8bbe9d52df72c93ea2847bae967))
* **version:** Upgrade next from 14.0.4 to 14.1.0 ([#136](https://github.com/keyshade-xyz/keyshade/issues/136)) ([c958865](https://github.com/keyshade-xyz/keyshade/commit/c958865c092bcae131419b79b8372dce45767cfd))
* **version:** Upgrade reflect-metadata from 0.1.14 to 0.2.1 ([#137](https://github.com/keyshade-xyz/keyshade/issues/137)) ([574b6ce](https://github.com/keyshade-xyz/keyshade/commit/574b6ce7b1d20a280e47268c1a5abd4bacb285a0))

## 1.0.0 (2024-02-09)


### ⚠ BREAKING CHANGES

* **api:** update workspace role mechanism and added functionality to create custom roles

### 🚀 Features

* add api-keys module ([abb2863](https://github.com/keyshade-xyz/keyshade/commit/abb28632c069bd01e95fbcc8081a5d2eed786b8f))
* add project module ([c96df17](https://github.com/keyshade-xyz/keyshade/commit/c96df17b94f96578903f3de68394458af8e8a9f2))
* add project, environment module ([fd5c4d7](https://github.com/keyshade-xyz/keyshade/commit/fd5c4d744467395c0b360916ed85bd6cf88c698e))
* Add RBAC ([b4cb14f](https://github.com/keyshade-xyz/keyshade/commit/b4cb14f7fbb29c1c53e562c654a4ab5495d69e9f))
* add secret module ([cd79172](https://github.com/keyshade-xyz/keyshade/commit/cd79172ca33aa5c6c72b7859acdeaa2bb5b10970))
* add swagger ([b15dbb0](https://github.com/keyshade-xyz/keyshade/commit/b15dbb05b3d2dae83d7250437dfa82077fd31ae4))
* added the auto assign workflow yaml file ([eadca0c](https://github.com/keyshade-xyz/keyshade/commit/eadca0c0a2012344ef9030fade217e9cf57b7783))
* added the auto assign workflow yaml file ([5e1d0f1](https://github.com/keyshade-xyz/keyshade/commit/5e1d0f153cda371a415c27e92ac558b770058b3e))
* **api:** add user module ([ebfb2ec](https://github.com/keyshade-xyz/keyshade/commit/ebfb2ec1fd17609fadbe63d56bd169ea21c893cf))
* **api:** add workspace module ([504f0db](https://github.com/keyshade-xyz/keyshade/commit/504f0db3d4363333251daa813843cc90dccdc067))
* **api:** update workspace role mechanism and added functionality to create custom roles ([6144aea](https://github.com/keyshade-xyz/keyshade/commit/6144aea23ea66cdc1fa7e29080e349d299154933))
* **api:** updated functionality of API key ([#114](https://github.com/keyshade-xyz/keyshade/issues/114)) ([308fbf4](https://github.com/keyshade-xyz/keyshade/commit/308fbf4c566bd00bac5e969a51b0d38ba89772d1))
* AutoCreate Admin On Startup ([#101](https://github.com/keyshade-xyz/keyshade/issues/101)) ([32fac3e](https://github.com/keyshade-xyz/keyshade/commit/32fac3e669a6dd6353ed862a8cb367d184038968))
* create user endpoint ([53913f5](https://github.com/keyshade-xyz/keyshade/commit/53913f545aee2a87571cd9798cd4979b8b47cb4d))
* dockerize api ([ce8ee23](https://github.com/keyshade-xyz/keyshade/commit/ce8ee23769f0bbbf5b2517278f8d2ea1e58661c1))
* dockerize api ([dfbc58e](https://github.com/keyshade-xyz/keyshade/commit/dfbc58eaaa15f0529d00e1441c0f56d46a9c8ce0))
* dockerize api ([63f0a27](https://github.com/keyshade-xyz/keyshade/commit/63f0a2752885b39d13e596b35f70318f36004dc5))
* dockerize api ([265cec0](https://github.com/keyshade-xyz/keyshade/commit/265cec0f58a9efa5001528ac7e9f4f71be20f190))
* dockerize api ([ed595c7](https://github.com/keyshade-xyz/keyshade/commit/ed595c79e5739f6d15cd80a6f18d081587d55b34))
* dockerize api ([6b756e8](https://github.com/keyshade-xyz/keyshade/commit/6b756e8c70388057823e3ef05ae72a059da84e9c))
* finish environment module ([aaf6783](https://github.com/keyshade-xyz/keyshade/commit/aaf67834298bd6b4836686c4342dc75cce63d1cf))
* husky configured ([77bba02](https://github.com/keyshade-xyz/keyshade/commit/77bba023c52c871b9a54499cdbc72b67c5438e4f))
* invalidate older OTPs ([8ca222a](https://github.com/keyshade-xyz/keyshade/commit/8ca222aedd6e4532a498a8b70d837095cfd53a68))
* landing page ([e1ec4d1](https://github.com/keyshade-xyz/keyshade/commit/e1ec4d171e184d381efb0768d9a3deadb92d5dba))
* **nx-cloud:** setup nx workspace ([#108](https://github.com/keyshade-xyz/keyshade/issues/108)) ([cb61d45](https://github.com/keyshade-xyz/keyshade/commit/cb61d458519ff7b06c87e2a9ac99d2109e934895))
* **oauth:** add github oauth ([5b930a1](https://github.com/keyshade-xyz/keyshade/commit/5b930a19dd98b77616b8023c30f2c8c18eec8b8b))
* **oauth:** get 'name' and 'avatar' of the user ([20e8dbf](https://github.com/keyshade-xyz/keyshade/commit/20e8dbf081aa8948f71fb7cf999125cb175f4bc2))
* responsive landing ([97bbb0c](https://github.com/keyshade-xyz/keyshade/commit/97bbb0cb42c3b89fd1c9aede9e4d87a215aab7cf))


### 🐛 Bug Fixes

* **api:** addressed logical errors ([fc14179](https://github.com/keyshade-xyz/keyshade/commit/fc14179b2186711a79c4e6fc025fac2b82588fbc))
* **api:** removed api-keys.types.ts ([2b5b1f8](https://github.com/keyshade-xyz/keyshade/commit/2b5b1f8b5ff4b8e13e2b4cfa918e6f6a9a7c2086))
* **api:** update role based access ([5e3456c](https://github.com/keyshade-xyz/keyshade/commit/5e3456cf40ae8a9befa7dba8a9a59be6b95cefb1))
* fix syntax error in auto-assign.yaml ([e59d410](https://github.com/keyshade-xyz/keyshade/commit/e59d410f714d89daf53f7e99fd7b1ce30a67e059))
* indendation errors ([8212d59](https://github.com/keyshade-xyz/keyshade/commit/8212d591df508605d011ce0ad7e4c14162351d16))
* issue auto assign cannot read properties of undefined assignees ([0ecc749](https://github.com/keyshade-xyz/keyshade/commit/0ecc7494dade74d8ad59da25a73430564808f013))
* **landing-page:** Make mobile responsive ([3fd5a1d](https://github.com/keyshade-xyz/keyshade/commit/3fd5a1d51671483089da6c6390720d80798f8373)), closes [#41](https://github.com/keyshade-xyz/keyshade/issues/41)
* **landing-page:** Make mobile responsive ([0596473](https://github.com/keyshade-xyz/keyshade/commit/0596473718a6b46e8bbad1b46340a44cbbe33bd9)), closes [#41](https://github.com/keyshade-xyz/keyshade/issues/41)
* **landing-page:** Make mobile responsive  ([2afaf0d](https://github.com/keyshade-xyz/keyshade/commit/2afaf0dda9d164f4c3a1ed05630a1aa45acf5cda)), closes [#41](https://github.com/keyshade-xyz/keyshade/issues/41)
* made images not selectable and undraggable ([b8c200e](https://github.com/keyshade-xyz/keyshade/commit/b8c200e7ac33b201a552ca128f6de0938b316313))
* Merge main and made a small fix ([89b0d71](https://github.com/keyshade-xyz/keyshade/commit/89b0d7181abb198404d37e5f8aabce51d7849e30))
* nx run dev:api failing due to DI error ([81c63ca](https://github.com/keyshade-xyz/keyshade/commit/81c63ca8c89e0dba801167f0216bb4a8b0b79599))
* remove hardcoded email from adminUserCreateEmail mail function ([b2b9a9e](https://github.com/keyshade-xyz/keyshade/commit/b2b9a9ed87ec999f4d428b819d44f3b129fe4c5d))
* remove pnpm-lock as it is causing issues in pnpm install ([d3b54d8](https://github.com/keyshade-xyz/keyshade/commit/d3b54d85d9a2c576c3b5964a939538e2dcae33fb))
* resolved merge conflict ([7ff7afb](https://github.com/keyshade-xyz/keyshade/commit/7ff7afbd97665bee359399d18f6b6560206fed87))
* typo ([587f06b](https://github.com/keyshade-xyz/keyshade/commit/587f06b4f0497df22cc5a453c8db13fe0c53f2ef))
* Update discord link in README.md ([c7e4b5a](https://github.com/keyshade-xyz/keyshade/commit/c7e4b5aac24e04a181a1ab21bad9417cf814c7e4))
* update lockfile ([b6f6e80](https://github.com/keyshade-xyz/keyshade/commit/b6f6e80b66f8531e9bacce8876bfe3d9ec67fb75))
* update pnpm scripts ([e73a877](https://github.com/keyshade-xyz/keyshade/commit/e73a87769d235f9c61e5f69d9e0ec73bb4f3eaad))
* update web workflow ([add46dd](https://github.com/keyshade-xyz/keyshade/commit/add46ddd6fc01f4a9202e4b4adb52e847e18d39f))


### 📚 Documentation

* Add CHANGELOG.md ([184220e](https://github.com/keyshade-xyz/keyshade/commit/184220e511016d8762fa587375b6a1fa3c651062))
* add docs folder ([e252d68](https://github.com/keyshade-xyz/keyshade/commit/e252d688357c8bcb0cb4c7d360edca6f2957a945))
* Add getting-started.md ([617c346](https://github.com/keyshade-xyz/keyshade/commit/617c3460f6debf6f08bddc38010dc62a7e13b59a))
* update CHANGELOG.md ([b01b5ca](https://github.com/keyshade-xyz/keyshade/commit/b01b5ca6dc5ebce476cdbdfb341236b66484e7bc))
* Update CONTRIBUTING.md ([7fc895d](https://github.com/keyshade-xyz/keyshade/commit/7fc895d39c128dacb16f184440722fab71f523cf))
* update DB_URL in .env.example ([325880e](https://github.com/keyshade-xyz/keyshade/commit/325880e42f2ce43736a53a82c1bab0a9c83f4d64))
* update PULL_REQUEST_TEMPLATE.md ([e091d40](https://github.com/keyshade-xyz/keyshade/commit/e091d40213fd238c74fbd3ec9f8282fb90c99ca2))
* update README.md ([fb902e5](https://github.com/keyshade-xyz/keyshade/commit/fb902e5052e6707eae09af296aa93d8dbb6869f4))
* update README.md ([d3d0d86](https://github.com/keyshade-xyz/keyshade/commit/d3d0d861b8d78348dc050d7c3b16f1bc32359e60))


### 🔧 Miscellaneous Chores

* ad start:api script in package.json ([ee3bc19](https://github.com/keyshade-xyz/keyshade/commit/ee3bc19bcbe83a1840ae64d466065e95b0c827f4))
* add `getAllUsers` test  ([0b51a02](https://github.com/keyshade-xyz/keyshade/commit/0b51a02c7799d010637dacb357fa6c5a478698b5))
* add auto release and commit config ([0fe7d19](https://github.com/keyshade-xyz/keyshade/commit/0fe7d19614621deaec83904721ad97c49d691748))
* add husky pre-commit check ([62bf77e](https://github.com/keyshade-xyz/keyshade/commit/62bf77ebe3c9941c722c126e2bda325b66275b30))
* add pr auto tag workflow ([7a44137](https://github.com/keyshade-xyz/keyshade/commit/7a44137bc6dd9e7c64baf8c4dd468b2676d378e3))
* add PR lint ([bb28cb7](https://github.com/keyshade-xyz/keyshade/commit/bb28cb7b2e6d1501c6525690a744068fc5c6e56c))
* add prettier:fix in package.json and husky ([2451301](https://github.com/keyshade-xyz/keyshade/commit/2451301fe9bf0f32b354a7b3ffb548866cd6b265))
* add release drafter config ([de36d9f](https://github.com/keyshade-xyz/keyshade/commit/de36d9f5f5de639be300115b7dd62826613d15a6))
* add render hook in web to auto-deploy ([b0228d0](https://github.com/keyshade-xyz/keyshade/commit/b0228d021e524a8eaf1760f58b74b623ea6ef64a))
* add semantic release ([af12daa](https://github.com/keyshade-xyz/keyshade/commit/af12daa7e8947d50bf346246412962738b2c9ee0))
* add test workflow ([77c49de](https://github.com/keyshade-xyz/keyshade/commit/77c49def7fc0b9ec06ce2ccd0790b141fb0a4839))
* add workflow for CI and deployment of web ([f49b7db](https://github.com/keyshade-xyz/keyshade/commit/f49b7db41458583a74a84f4433e2d685ab1855f9))
* adding test command to pre commit ([09805a5](https://github.com/keyshade-xyz/keyshade/commit/09805a545639ce4d107dc067e7f50db1a8f4955b))
* **api:** update dockerfile entrypoint ([3962beb](https://github.com/keyshade-xyz/keyshade/commit/3962bebf91973e5ca18f47bf5dab5c4fd94cf873))
* **auth:** loading github module optionally ([#112](https://github.com/keyshade-xyz/keyshade/issues/112)) ([9263737](https://github.com/keyshade-xyz/keyshade/commit/9263737bcf7c7e4ed247f8ae8dc69351a30def6a))
* **ci:** add dummy envs to api workflow ([4f6bb44](https://github.com/keyshade-xyz/keyshade/commit/4f6bb4492a47676d56439d730f49c71275c8d60a))
* **ci:** add fly.io ([46bcd22](https://github.com/keyshade-xyz/keyshade/commit/46bcd225f66aba763ee4619531d3cfec5cb68e11))
* **ci:** fixed broken fly installation ([6ec728f](https://github.com/keyshade-xyz/keyshade/commit/6ec728ff94c7f74d3b89947f8fef7e7ada6dc996))
* **ci:** integrated codecov ([0daeff3](https://github.com/keyshade-xyz/keyshade/commit/0daeff3422818463077e02d681715a945bf21340))
* **ci:** moving to gitflow release ([1f86a99](https://github.com/keyshade-xyz/keyshade/commit/1f86a99f7a84a9b79aa4eca6e761a4700509297f))
* **ci:** remove auto tag workflow ([63daab3](https://github.com/keyshade-xyz/keyshade/commit/63daab3e23f42ab8dc9666b1490d2990554208ea))
* **ci:** update CI deploy stage ([cd3c47e](https://github.com/keyshade-xyz/keyshade/commit/cd3c47e584272663a1d316f7da4a111d133e59b5))
* **ci:** update coverage base path ([92e3620](https://github.com/keyshade-xyz/keyshade/commit/92e3620b63cc3d62d2a3ab5838d05266b8998c94))
* **ci:** update release workflow deps ([f2a8243](https://github.com/keyshade-xyz/keyshade/commit/f2a8243bddfca192feceb321a4415b4a039c5c94))
* **ci:** update stage deploy condition ([362e0b0](https://github.com/keyshade-xyz/keyshade/commit/362e0b0940b252b02a43d99d5dd549533c7a6b6e))
* **ci:** update workflow ([d59427e](https://github.com/keyshade-xyz/keyshade/commit/d59427e9d439c676f6bcc55ad88cbc9bb382fd5c))
* fix changelog script ([0c8c0ef](https://github.com/keyshade-xyz/keyshade/commit/0c8c0efe7743d4f35c5b0301e8e5020b6bf86977))
* fix changelog script ([78848a0](https://github.com/keyshade-xyz/keyshade/commit/78848a02f6c0a2be93ca01e43332ac215814b7c4))
* house cleaning ([ae73e7a](https://github.com/keyshade-xyz/keyshade/commit/ae73e7a8927e4567f9db39c40af313fc133b387c))
* **lint:** overwrite default eslint rules ([4bfc998](https://github.com/keyshade-xyz/keyshade/commit/4bfc998006bbede07741689b428c5f0551c6138c))
* **package.json:** update release settings ([9b0e414](https://github.com/keyshade-xyz/keyshade/commit/9b0e4141180d23c39229bc98916b98cb39615b32))
* **release:** 0.1.0-alpha ([f166ee1](https://github.com/keyshade-xyz/keyshade/commit/f166ee173c1a186d3d0cb48269d8eddda9aebf81))
* **release:** 0.1.0-alpha ([867fb08](https://github.com/keyshade-xyz/keyshade/commit/867fb08deed16196a83f08de225528fda7bd8d1c))
* **release:** 0.2.0-alpha ([de7726c](https://github.com/keyshade-xyz/keyshade/commit/de7726c345d40661bc37c5128260aa491fc6a194))
* **release:** 1.0.0-alpha.1 [skip ci] ([488dd49](https://github.com/keyshade-xyz/keyshade/commit/488dd492c88db16411d59264eb7128a015117522)), closes [#101](https://github.com/keyshade-xyz/keyshade/issues/101)
* **release:** 1.0.0-alpha.2 [skip ci] ([ca12cc3](https://github.com/keyshade-xyz/keyshade/commit/ca12cc3bbf9f4cf68c5b984ed7be0201a0059026)), closes [#108](https://github.com/keyshade-xyz/keyshade/issues/108) [#103](https://github.com/keyshade-xyz/keyshade/issues/103) [#106](https://github.com/keyshade-xyz/keyshade/issues/106)
* remove / for consistancy ([0da0953](https://github.com/keyshade-xyz/keyshade/commit/0da0953fa0aa2c7295e1ed6652684c1395434631))
* remove duplicate auth service ([f97adf0](https://github.com/keyshade-xyz/keyshade/commit/f97adf00ed0dc43bd41bd4af18ff5680ad3b4fc6))
* remove SDK folders ([614c304](https://github.com/keyshade-xyz/keyshade/commit/614c304746388de8c5930ae16421ca6abcc04cba))
* remove sdk-node workflow ([655ad27](https://github.com/keyshade-xyz/keyshade/commit/655ad27d049170f029bd031d06625eb5e53a09a0))
* remove unused import ([7f189dd](https://github.com/keyshade-xyz/keyshade/commit/7f189ddc20718b74dd590b826816eced2795e31d))
* remove unwanted package.json ([14cd7ad](https://github.com/keyshade-xyz/keyshade/commit/14cd7ad6d3145d8f04a1c5dd75f97422ca515bb3))
* rename file ([0aba0f3](https://github.com/keyshade-xyz/keyshade/commit/0aba0f3bc05edd5da59028fa31d483d7b9e327d6))
* replace script with makefile ([a92311e](https://github.com/keyshade-xyz/keyshade/commit/a92311e350089a0c1659185f601676bf78735b0e))
* replace script with makefile ([62d582d](https://github.com/keyshade-xyz/keyshade/commit/62d582d8b6778198669913287f1588c4fb6114b9))
* resolve comments ([f7562c4](https://github.com/keyshade-xyz/keyshade/commit/f7562c4d28570f3376d92e129a002d071b7d0e6f))
* update contribution readme with step to auto assign issue ([6459622](https://github.com/keyshade-xyz/keyshade/commit/64596226810cf0e6785ece1d022acbce05f8ab5e))
* update docker push workflow ([e286b1a](https://github.com/keyshade-xyz/keyshade/commit/e286b1a5b0e6729a37c6bd663f577c515ed76ef6))
* update docker push workflow ([#103](https://github.com/keyshade-xyz/keyshade/issues/103)) ([d562e5a](https://github.com/keyshade-xyz/keyshade/commit/d562e5a1342749d6f04afb960189e92952fd01f5))
* update preset ([004ea3a](https://github.com/keyshade-xyz/keyshade/commit/004ea3a5b8f1b1c2ab9fcd0ee8fbb5bacf0cc858))
* Update web CI and add Dockerfile for web ([fc9571e](https://github.com/keyshade-xyz/keyshade/commit/fc9571e5b61b2810f571a17bb757c8f20f809e5b))


### 🔨 Code Refactoring

* addressed sonarqube lints ([#106](https://github.com/keyshade-xyz/keyshade/issues/106)) ([3df13f8](https://github.com/keyshade-xyz/keyshade/commit/3df13f884687586af983c8f36d26cf3a904e70e9))
* move mock data folder inside common module ([832383e](https://github.com/keyshade-xyz/keyshade/commit/832383eabd24ddd47461fb42ebe705957c5483ca))
* service functions as suggested ([c1ae78a](https://github.com/keyshade-xyz/keyshade/commit/c1ae78abb38006cd22ef0c5ea359253e7e8ff6e4))
* user mock data change ([ea5c504](https://github.com/keyshade-xyz/keyshade/commit/ea5c504360c4cd0ad28bb5cc01fff66fccacc423))

## [1.0.0-alpha.2](https://github.com/keyshade-xyz/keyshade/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2024-02-06)


### ⚠ BREAKING CHANGES

* **api:** update workspace role mechanism and added functionality to create custom roles

### 🚀 Features

* **api:** update workspace role mechanism and added functionality to create custom roles ([6144aea](https://github.com/keyshade-xyz/keyshade/commit/6144aea23ea66cdc1fa7e29080e349d299154933))
* **nx-cloud:** setup nx workspace ([#108](https://github.com/keyshade-xyz/keyshade/issues/108)) ([cb61d45](https://github.com/keyshade-xyz/keyshade/commit/cb61d458519ff7b06c87e2a9ac99d2109e934895))


### 🔧 Miscellaneous Chores

* **api:** update dockerfile entrypoint ([3962beb](https://github.com/keyshade-xyz/keyshade/commit/3962bebf91973e5ca18f47bf5dab5c4fd94cf873))
* **ci:** add dummy envs to api workflow ([4f6bb44](https://github.com/keyshade-xyz/keyshade/commit/4f6bb4492a47676d56439d730f49c71275c8d60a))
* **ci:** add fly.io ([46bcd22](https://github.com/keyshade-xyz/keyshade/commit/46bcd225f66aba763ee4619531d3cfec5cb68e11))
* **ci:** fixed broken fly installation ([6ec728f](https://github.com/keyshade-xyz/keyshade/commit/6ec728ff94c7f74d3b89947f8fef7e7ada6dc996))
* **ci:** integrated codecov ([0daeff3](https://github.com/keyshade-xyz/keyshade/commit/0daeff3422818463077e02d681715a945bf21340))
* **ci:** remove auto tag workflow ([63daab3](https://github.com/keyshade-xyz/keyshade/commit/63daab3e23f42ab8dc9666b1490d2990554208ea))
* **ci:** update release workflow deps ([f2a8243](https://github.com/keyshade-xyz/keyshade/commit/f2a8243bddfca192feceb321a4415b4a039c5c94))
* **package.json:** update release settings ([9b0e414](https://github.com/keyshade-xyz/keyshade/commit/9b0e4141180d23c39229bc98916b98cb39615b32))
* update docker push workflow ([e286b1a](https://github.com/keyshade-xyz/keyshade/commit/e286b1a5b0e6729a37c6bd663f577c515ed76ef6))
* update docker push workflow ([#103](https://github.com/keyshade-xyz/keyshade/issues/103)) ([d562e5a](https://github.com/keyshade-xyz/keyshade/commit/d562e5a1342749d6f04afb960189e92952fd01f5))
* update preset ([004ea3a](https://github.com/keyshade-xyz/keyshade/commit/004ea3a5b8f1b1c2ab9fcd0ee8fbb5bacf0cc858))


### 🔨 Code Refactoring

* addressed sonarqube lints ([#106](https://github.com/keyshade-xyz/keyshade/issues/106)) ([3df13f8](https://github.com/keyshade-xyz/keyshade/commit/3df13f884687586af983c8f36d26cf3a904e70e9))

# 1.0.0-alpha.1 (2024-02-02)


### bug

* send email async ([728256d](https://github.com/keyshade-xyz/keyshade/commit/728256d0a4d2f45ba7b805affc408c03228c8c4f))

### build

* Add Lint Workflows for `cli` and `sdk-node` ([93ae134](https://github.com/keyshade-xyz/keyshade/commit/93ae134abf5e8113526cdd58f50fa270bb550454))
* pnpm cache setup ([2db196f](https://github.com/keyshade-xyz/keyshade/commit/2db196f341ad559a35db5c17098e3fa3a91e5767))

### chore

* ad start:api script in package.json ([ee3bc19](https://github.com/keyshade-xyz/keyshade/commit/ee3bc19bcbe83a1840ae64d466065e95b0c827f4))
* add `getAllUsers` test  ([0b51a02](https://github.com/keyshade-xyz/keyshade/commit/0b51a02c7799d010637dacb357fa6c5a478698b5))
* add auto release and commit config ([0fe7d19](https://github.com/keyshade-xyz/keyshade/commit/0fe7d19614621deaec83904721ad97c49d691748))
* add husky pre-commit check ([62bf77e](https://github.com/keyshade-xyz/keyshade/commit/62bf77ebe3c9941c722c126e2bda325b66275b30))
* add pr auto tag workflow ([7a44137](https://github.com/keyshade-xyz/keyshade/commit/7a44137bc6dd9e7c64baf8c4dd468b2676d378e3))
* add PR lint ([bb28cb7](https://github.com/keyshade-xyz/keyshade/commit/bb28cb7b2e6d1501c6525690a744068fc5c6e56c))
* add prettier:fix in package.json and husky ([2451301](https://github.com/keyshade-xyz/keyshade/commit/2451301fe9bf0f32b354a7b3ffb548866cd6b265))
* add release drafter config ([de36d9f](https://github.com/keyshade-xyz/keyshade/commit/de36d9f5f5de639be300115b7dd62826613d15a6))
* add render hook in web to auto-deploy ([b0228d0](https://github.com/keyshade-xyz/keyshade/commit/b0228d021e524a8eaf1760f58b74b623ea6ef64a))
* add semantic release ([af12daa](https://github.com/keyshade-xyz/keyshade/commit/af12daa7e8947d50bf346246412962738b2c9ee0))
* add test workflow ([77c49de](https://github.com/keyshade-xyz/keyshade/commit/77c49def7fc0b9ec06ce2ccd0790b141fb0a4839))
* add workflow for CI and deployment of web ([f49b7db](https://github.com/keyshade-xyz/keyshade/commit/f49b7db41458583a74a84f4433e2d685ab1855f9))
* adding test command to pre commit ([09805a5](https://github.com/keyshade-xyz/keyshade/commit/09805a545639ce4d107dc067e7f50db1a8f4955b))
* create a cron function that will run every hour to clean up expired otps ([5ffb54d](https://github.com/keyshade-xyz/keyshade/commit/5ffb54d7c8c584cccebcc71728ec84864a49332a))
* fix changelog script ([0c8c0ef](https://github.com/keyshade-xyz/keyshade/commit/0c8c0efe7743d4f35c5b0301e8e5020b6bf86977))
* fix changelog script ([78848a0](https://github.com/keyshade-xyz/keyshade/commit/78848a02f6c0a2be93ca01e43332ac215814b7c4))
* remove / for consistancy ([0da0953](https://github.com/keyshade-xyz/keyshade/commit/0da0953fa0aa2c7295e1ed6652684c1395434631))
* remove duplicate auth service ([f97adf0](https://github.com/keyshade-xyz/keyshade/commit/f97adf00ed0dc43bd41bd4af18ff5680ad3b4fc6))
* remove SDK folders ([614c304](https://github.com/keyshade-xyz/keyshade/commit/614c304746388de8c5930ae16421ca6abcc04cba))
* remove sdk-node workflow ([655ad27](https://github.com/keyshade-xyz/keyshade/commit/655ad27d049170f029bd031d06625eb5e53a09a0))
* remove unused import ([7f189dd](https://github.com/keyshade-xyz/keyshade/commit/7f189ddc20718b74dd590b826816eced2795e31d))
* remove unwanted package.json ([14cd7ad](https://github.com/keyshade-xyz/keyshade/commit/14cd7ad6d3145d8f04a1c5dd75f97422ca515bb3))
* rename file ([0aba0f3](https://github.com/keyshade-xyz/keyshade/commit/0aba0f3bc05edd5da59028fa31d483d7b9e327d6))
* replace script with makefile ([a92311e](https://github.com/keyshade-xyz/keyshade/commit/a92311e350089a0c1659185f601676bf78735b0e))
* replace script with makefile ([62d582d](https://github.com/keyshade-xyz/keyshade/commit/62d582d8b6778198669913287f1588c4fb6114b9))
* resolve comments ([f7562c4](https://github.com/keyshade-xyz/keyshade/commit/f7562c4d28570f3376d92e129a002d071b7d0e6f))
* update contribution readme with step to auto assign issue ([6459622](https://github.com/keyshade-xyz/keyshade/commit/64596226810cf0e6785ece1d022acbce05f8ab5e))
* Update web CI and add Dockerfile for web ([fc9571e](https://github.com/keyshade-xyz/keyshade/commit/fc9571e5b61b2810f571a17bb757c8f20f809e5b))

### docs

* Add CHANGELOG.md ([184220e](https://github.com/keyshade-xyz/keyshade/commit/184220e511016d8762fa587375b6a1fa3c651062))
* add docs folder ([e252d68](https://github.com/keyshade-xyz/keyshade/commit/e252d688357c8bcb0cb4c7d360edca6f2957a945))
* Add getting-started.md ([617c346](https://github.com/keyshade-xyz/keyshade/commit/617c3460f6debf6f08bddc38010dc62a7e13b59a))
* update CHANGELOG.md ([b01b5ca](https://github.com/keyshade-xyz/keyshade/commit/b01b5ca6dc5ebce476cdbdfb341236b66484e7bc))
* Update CONTRIBUTING.md ([7fc895d](https://github.com/keyshade-xyz/keyshade/commit/7fc895d39c128dacb16f184440722fab71f523cf))
* update DB_URL in .env.example ([325880e](https://github.com/keyshade-xyz/keyshade/commit/325880e42f2ce43736a53a82c1bab0a9c83f4d64))
* update PULL_REQUEST_TEMPLATE.md ([e091d40](https://github.com/keyshade-xyz/keyshade/commit/e091d40213fd238c74fbd3ec9f8282fb90c99ca2))
* update README.md ([fb902e5](https://github.com/keyshade-xyz/keyshade/commit/fb902e5052e6707eae09af296aa93d8dbb6869f4))
* update README.md ([d3d0d86](https://github.com/keyshade-xyz/keyshade/commit/d3d0d861b8d78348dc050d7c3b16f1bc32359e60))

### feat

* add api-keys module ([abb2863](https://github.com/keyshade-xyz/keyshade/commit/abb28632c069bd01e95fbcc8081a5d2eed786b8f))
* add project module ([c96df17](https://github.com/keyshade-xyz/keyshade/commit/c96df17b94f96578903f3de68394458af8e8a9f2))
* add project, environment module ([fd5c4d7](https://github.com/keyshade-xyz/keyshade/commit/fd5c4d744467395c0b360916ed85bd6cf88c698e))
* Add RBAC ([b4cb14f](https://github.com/keyshade-xyz/keyshade/commit/b4cb14f7fbb29c1c53e562c654a4ab5495d69e9f))
* add secret module ([cd79172](https://github.com/keyshade-xyz/keyshade/commit/cd79172ca33aa5c6c72b7859acdeaa2bb5b10970))
* add swagger ([b15dbb0](https://github.com/keyshade-xyz/keyshade/commit/b15dbb05b3d2dae83d7250437dfa82077fd31ae4))
* added the auto assign workflow yaml file ([eadca0c](https://github.com/keyshade-xyz/keyshade/commit/eadca0c0a2012344ef9030fade217e9cf57b7783))
* added the auto assign workflow yaml file ([5e1d0f1](https://github.com/keyshade-xyz/keyshade/commit/5e1d0f153cda371a415c27e92ac558b770058b3e))
* AutoCreate Admin On Startup (#101) ([32fac3e](https://github.com/keyshade-xyz/keyshade/commit/32fac3e669a6dd6353ed862a8cb367d184038968)), closes [#101](https://github.com/keyshade-xyz/keyshade/issues/101)
* create user endpoint ([53913f5](https://github.com/keyshade-xyz/keyshade/commit/53913f545aee2a87571cd9798cd4979b8b47cb4d))
* dockerize api ([ce8ee23](https://github.com/keyshade-xyz/keyshade/commit/ce8ee23769f0bbbf5b2517278f8d2ea1e58661c1))
* dockerize api ([dfbc58e](https://github.com/keyshade-xyz/keyshade/commit/dfbc58eaaa15f0529d00e1441c0f56d46a9c8ce0))
* dockerize api ([63f0a27](https://github.com/keyshade-xyz/keyshade/commit/63f0a2752885b39d13e596b35f70318f36004dc5))
* dockerize api ([265cec0](https://github.com/keyshade-xyz/keyshade/commit/265cec0f58a9efa5001528ac7e9f4f71be20f190))
* dockerize api ([ed595c7](https://github.com/keyshade-xyz/keyshade/commit/ed595c79e5739f6d15cd80a6f18d081587d55b34))
* dockerize api ([6b756e8](https://github.com/keyshade-xyz/keyshade/commit/6b756e8c70388057823e3ef05ae72a059da84e9c))
* finish environment module ([aaf6783](https://github.com/keyshade-xyz/keyshade/commit/aaf67834298bd6b4836686c4342dc75cce63d1cf))
* husky configured ([77bba02](https://github.com/keyshade-xyz/keyshade/commit/77bba023c52c871b9a54499cdbc72b67c5438e4f))
* invalidate older OTPs ([8ca222a](https://github.com/keyshade-xyz/keyshade/commit/8ca222aedd6e4532a498a8b70d837095cfd53a68))
* landing page ([e1ec4d1](https://github.com/keyshade-xyz/keyshade/commit/e1ec4d171e184d381efb0768d9a3deadb92d5dba))
* responsive landing ([97bbb0c](https://github.com/keyshade-xyz/keyshade/commit/97bbb0cb42c3b89fd1c9aede9e4d87a215aab7cf))

### fix

* fix syntax error in auto-assign.yaml ([e59d410](https://github.com/keyshade-xyz/keyshade/commit/e59d410f714d89daf53f7e99fd7b1ce30a67e059))
* indendation errors ([8212d59](https://github.com/keyshade-xyz/keyshade/commit/8212d591df508605d011ce0ad7e4c14162351d16))
* issue auto assign cannot read properties of undefined assignees ([0ecc749](https://github.com/keyshade-xyz/keyshade/commit/0ecc7494dade74d8ad59da25a73430564808f013))
* Merge main and made a small fix ([89b0d71](https://github.com/keyshade-xyz/keyshade/commit/89b0d7181abb198404d37e5f8aabce51d7849e30))
* nx run dev:api failing due to DI error ([81c63ca](https://github.com/keyshade-xyz/keyshade/commit/81c63ca8c89e0dba801167f0216bb4a8b0b79599))
* remove hardcoded email from adminUserCreateEmail mail function ([b2b9a9e](https://github.com/keyshade-xyz/keyshade/commit/b2b9a9ed87ec999f4d428b819d44f3b129fe4c5d))
* remove pnpm-lock as it is causing issues in pnpm install ([d3b54d8](https://github.com/keyshade-xyz/keyshade/commit/d3b54d85d9a2c576c3b5964a939538e2dcae33fb))
* resolved merge conflict ([7ff7afb](https://github.com/keyshade-xyz/keyshade/commit/7ff7afbd97665bee359399d18f6b6560206fed87))
* typo ([587f06b](https://github.com/keyshade-xyz/keyshade/commit/587f06b4f0497df22cc5a453c8db13fe0c53f2ef))
* Update discord link in README.md ([c7e4b5a](https://github.com/keyshade-xyz/keyshade/commit/c7e4b5aac24e04a181a1ab21bad9417cf814c7e4))
* update lockfile ([b6f6e80](https://github.com/keyshade-xyz/keyshade/commit/b6f6e80b66f8531e9bacce8876bfe3d9ec67fb75))
* update pnpm scripts ([e73a877](https://github.com/keyshade-xyz/keyshade/commit/e73a87769d235f9c61e5f69d9e0ec73bb4f3eaad))
* update web workflow ([add46dd](https://github.com/keyshade-xyz/keyshade/commit/add46ddd6fc01f4a9202e4b4adb52e847e18d39f))

### Fix

* Fix: ([77f8a84](https://github.com/keyshade-xyz/keyshade/commit/77f8a84354f2dfb5b813bb9f860d20cac59ed9f8))
* made images not selectable and undraggable ([b8c200e](https://github.com/keyshade-xyz/keyshade/commit/b8c200e7ac33b201a552ca128f6de0938b316313))

### GitBook

* No commit message ([9cc83c9](https://github.com/keyshade-xyz/keyshade/commit/9cc83c95eaeebaf4a08a1b52164afd004e7da670))

### patch

* generate new migration ([00b516f](https://github.com/keyshade-xyz/keyshade/commit/00b516f658b7e3d5772cd690f2509b177ce73fca))
* improved query of otp ([d9d9260](https://github.com/keyshade-xyz/keyshade/commit/d9d926038055bb2c69bdc05432a8fcd541bb46c3))
* remove free tier data from migration ([44dc980](https://github.com/keyshade-xyz/keyshade/commit/44dc980610d4b8f47103f4d72d1af1397a15b510))
* remove repository layer and add prisma to service ([54cc6d4](https://github.com/keyshade-xyz/keyshade/commit/54cc6d403f5151100cb79a8321f628d18229eb1b))
* replace resend with nodemailer ([f0b0887](https://github.com/keyshade-xyz/keyshade/commit/f0b0887e494f44eeaf01e1ff0945eb2079641683))
* send email async ([091e49b](https://github.com/keyshade-xyz/keyshade/commit/091e49b48cdd66e7d133e8290959989d8453187e))

### refactor

* move mock data folder inside common module ([832383e](https://github.com/keyshade-xyz/keyshade/commit/832383eabd24ddd47461fb42ebe705957c5483ca))
* service functions as suggested ([c1ae78a](https://github.com/keyshade-xyz/keyshade/commit/c1ae78abb38006cd22ef0c5ea359253e7e8ff6e4))
* user mock data change ([ea5c504](https://github.com/keyshade-xyz/keyshade/commit/ea5c504360c4cd0ad28bb5cc01fff66fccacc423))

### test

* add tests for user service ([beb1955](https://github.com/keyshade-xyz/keyshade/commit/beb1955cc2c26c27102ae774b7f288f2e47c8d91))
* getAllUsers Controller ([cb84237](https://github.com/keyshade-xyz/keyshade/commit/cb84237fce9799d571c730877ee5406f97fb924e))

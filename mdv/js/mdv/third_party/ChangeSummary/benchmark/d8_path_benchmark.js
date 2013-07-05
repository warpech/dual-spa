// Copyright 2013 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// var console = { log: print };

createAndObservePaths();

var t1 = new Date();
mutatePathsAndDeliver(20, true);
var t2 = new Date();
print('Finished in: ' + (t2.getTime() - t1.getTime()) + 'ms');

unobservePaths();


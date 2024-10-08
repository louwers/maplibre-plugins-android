'use strict';

const fs = require('fs');
const ejs = require('ejs');

global.iff = function (condition, val) {
  return condition() ? val : "";
}

global.camelize = function (str) {
  return str.replace(/(?:^|-)(.)/g, function (_, x) {
    return x.toUpperCase();
  });
}

const excludeClasses = JSON.parse(fs.readFileSync('scripts/exclude-activity-gen.json', 'utf8'));
const appBasePath = 'app/src/main/java/org/maplibre/android/plugins/testapp/activity';
const testBasePath = 'app/src/androidTest/java/org/maplibre/android/plugins/gen';
const subPackages = fs.readdirSync(appBasePath);
const ejsConversionTask = ejs.compile(fs.readFileSync('app/src/androidTest/java/org/maplibre/android/plugins/activity.junit.ejs', 'utf8'), {strict: true});

if (!fs.existsSync(testBasePath)){
  fs.mkdirSync(testBasePath);
}

console.log("\nGenerating test activities:\n");
var generatedClasses = [];
var excludedClasses = [];
for(const subPackage of subPackages) {
  if(!(subPackage.slice(-5) == '.java')) {
    const activities = fs.readdirSync(appBasePath+'/'+subPackage);

    // create directories for package
    if (!fs.existsSync(testBasePath+"/"+subPackage)){
        fs.mkdirSync(testBasePath+"/"+subPackage);
    }

    for (const activity of activities) {
      var activityName;
      if (activity.slice(-5) === '.java') {
        // .java file
        activityName = activity.slice(0, -5);
      } else {
        // .kt file
        activityName = activity.slice(0, -3);
      }

      // create path for test file
      const filePath = testBasePath+"/"+subPackage+"/"+activityName+'Test.java';

      // try removing previous generated files
      try {
        fs.accessSync(filePath, fs.F_OK);
        fs.unlinkSync(filePath);
      } catch (e) {
      }

      // only generate test file if not part of exclude list + if contains Activity in name
      if ((!(excludeClasses.indexOf(activityName) > -1)) && activityName.includes("Activity")) {
        fs.writeFileSync(filePath, ejsConversionTask([activityName, subPackage]));
        generatedClasses.push(activityName);
      }else{
        excludedClasses.push(activityName);
      }
    }
  }
}

for(const generatedClass of generatedClasses){
  console.log(generatedClass+"Test");
}

console.log("\nFinished generating " + generatedClasses.length + " activity sanity tests, excluded " + excludeClasses.length + " classes.\n");
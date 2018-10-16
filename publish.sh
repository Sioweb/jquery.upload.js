git add -A &&\
git commit -am "$2" &&\
git push origin master &&\
git tag -a 3.1.$1 -m "3.1.$1" &&\
git push origin 3.1.$1 &&\
npm version patch
npm publish

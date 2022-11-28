PLATFORM=$1

pushd .
mkdir -p build/$PLATFORM
cp -r src/* build/$PLATFORM
cp -r platform/$PLATFORM/* build/$PLATFORM
cd build/$PLATFORM
mkdir -p ../../dist/$PLATFORM
zip -r ../../dist/$PLATFORM/opencheck.zip .
popd
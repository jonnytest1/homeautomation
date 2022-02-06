#include <Arduino.h>
#include <map>
using namespace std::__cxx11;

String base64_encode(const String &in);
String json(const std::map<String, String> content);
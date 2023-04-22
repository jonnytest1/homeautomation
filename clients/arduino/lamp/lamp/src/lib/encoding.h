#include "arduinoref.h"
#include <map>

String base64_encode(const String &in);
String json(const std::map<String, String> content);

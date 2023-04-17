#include "arduino-ref.h"
#include <map>
#include "jsonnode.h"

String base64_encode(const String &in);
String json(const std::map<String, String> content);

JsonNode parseJson(String body);
#ifndef CSTM_STR
#define CSTM_STR

#include <vector>
#include "arduinoref.h"

std::vector<String> string_split(String str, String needle);
int stoi(String str);
std::string itos(int num);
bool isNumeric(String str);
bool isWhitespace(char str);
std::string str_replace_all(std::string container, std::string first, std::string with);
std::string sub_string(std::string str, int start, int end);
bool str_includes(std::string str, std::string search);
String toArduinoString(std::string mystr);
#endif
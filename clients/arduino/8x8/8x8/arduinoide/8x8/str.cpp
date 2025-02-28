

#include <vector>
#include "arduinoref.h"
#include <sstream>
#include <string>
#include <iostream>
std::vector<String> string_split(String search, String delimiter)
{
    std::string s = search.c_str();
    size_t pos_start = 0,
           pos_end, delim_len = delimiter.length();
    std::string token;
    std::vector<String> res;

    while ((pos_end = s.find(delimiter.c_str(), pos_start)) != std::string::npos)
    {
        token = s.substr(pos_start, pos_end - pos_start);
        pos_start = pos_end + delim_len;
        res.push_back(token.c_str());
    }

    res.push_back(s.substr(pos_start).c_str());
    return res;
}

int stoi(String str)
{
    std::stringstream ss;
    int num;
    std::string strVal = str.c_str();
    ss << strVal;
    ss >> num;

    return num;
}
std::string itos(int num)
{
    std::stringstream ss;
    std::string strVal;
    ss << num;
    ss >> strVal;

    return strVal;
}
bool isWhitespace(char str)
{
    int charcode = int(str);
    return charcode == 10 || charcode == 32;
}

bool isNumeric(String str)
{
    for (std::string::size_type i = 0; i < str.length(); i++)
    {
        char character = str[i];
        int charcode = int(character);
        if ((charcode < 48 || charcode >= 58))
        {
            return false;
        }
    }
    return true;
}

std::string str_replace_all(std::string container, std::string search, std::string with)
{

    size_t from = 0;
    size_t start_pos = container.find(search, from);
    int found_pos = start_pos;
    while (found_pos > -1)
    {
        container = container.replace(start_pos, search.length(), with);
        from = found_pos + with.length();
        start_pos = container.find(search, from);
        found_pos = start_pos;
    }
    return container;
}

bool str_includes(std::string str, std::string search)
{
    return str.find(search) != std::string::npos;
}

std::string sub_string(std::string str, int start, int end)
{
    return str.substr(start, end - start);
}

String toArduinoString(std::string mystr)
{

    // should copy
    return String(mystr.c_str());
}
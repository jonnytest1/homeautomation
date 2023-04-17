

#include <vector>
#include "arduino-ref.h"
#include <sstream>

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
    ss << str;
    ss >> num;
}

bool isNumeric(String str)
{
    for (std::string::size_type i = 0; i < str.length(); i++)
    {
        char character = str[i];
        int charcode = int(character);
        if (charcode < 30 || charcode > 58)
        {
            return false;
        }
    }
    return true;
}
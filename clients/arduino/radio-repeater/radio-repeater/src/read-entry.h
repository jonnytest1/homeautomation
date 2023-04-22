#ifndef READ_ENTRY
#define READ_ENTRY

class ReadEntry
{
public:
    ReadEntry(long millis, int state, int duration);

    long millis;

    int state;

    int duration;
};

#endif
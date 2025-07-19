
#include <Arduino.h>

template <typename T> class Reference
{

  public:
    T *ref = nullptr;
    unsigned long lastUpdated = -1;

    void update(T *newRef)
    {
        delete ref;
        lastUpdated = millis();
        ref = newRef;
    };
};
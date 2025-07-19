
#pragma once

class RelayBoardRef
{
  public:
    virtual bool setRelay(int index, bool on) = 0;
    virtual ~RelayBoardRef() = default;
};

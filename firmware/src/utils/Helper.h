#ifndef OINKBREW_UTILS_HELPER_H
#define OINKBREW_UTILS_HELPER_H

#include "spark_wiring_string.h"
#include "spark_wiring_ipaddress.h"

class Helper
{
public:
    static void getBytes(const uint8_t *data, uint8_t len, char *buf);
    static void setBytes(uint8_t *data, const char *s, uint8_t len);

    static bool matchAddress(uint8_t *detected, uint8_t *configured, uint8_t count);
};

extern Helper helper;

#endif /* OINKBREW_UTILS_HELPER_H */
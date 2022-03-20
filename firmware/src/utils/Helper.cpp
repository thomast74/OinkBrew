#include "Helper.h"

/*******************************************************************************
 * Function Name  : getBytes
 * Description    : convert uint8_t into char*
 * Input          :
 * Output         : broadcast address as IPAddress
 * Return         :
 ******************************************************************************/
void Helper::getBytes(const uint8_t *data, uint8_t len, char *buf)
{
    for (int i = 0; i < len; i++)
    {
        uint8_t b = (data[i] >> 4) & 0x0f;
        *buf++ = (b > 9 ? b - 10 + 'A' : b + '0');
        b = data[i] & 0x0f;
        *buf++ = (b > 9 ? b - 10 + 'A' : b + '0');
    }
    *buf = 0;
}

/*******************************************************************************
 * Function Name  : setBytes
 * Description    : convert const char* into uint8_t
 * Input          :
 * Output         :
 * Return         :
 ******************************************************************************/
void Helper::setBytes(uint8_t *data, const char *s, uint8_t len)
{
    char c;
    while ((c = *s++))
    {
        uint8_t d = (c >= 'A' ? c - 'A' + 10 : c - '0') << 4;
        c = *s++;
        d |= (c >= 'A' ? c - 'A' + 10 : c - '0');
        *data++ = d;
    }
}

/*******************************************************************************
 * Function Name  : matchAddress
 * Description    : tests if two DeviceAddress are the same
 * Input          : hw_adress to check and the number of bytes
 * Output         : true if a match, false if not matching
 * Return         :
 ******************************************************************************/
bool Helper::matchAddress(uint8_t *detected, uint8_t *configured, uint8_t count)
{

    if (!configured[0])
        return true;

    while (count-- > 0)
    {
        if (detected[count] != configured[count])
            return false;
    }

    return true;
}

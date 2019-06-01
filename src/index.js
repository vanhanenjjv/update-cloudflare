import { existsSync, readFileSync } from 'fs';
import Cloudflare from 'cloudflare';
import Axios from 'axios';

//#region Parse arguments

const argv = require('minimist')(process.argv.splice(2), {
  string: 'configuration',
  alias: { 
    c: 'configuration' 
  }
});

if (!argv['configuration'])
  throw new Error('You need to specify the path to the configuration file.');

//#endregion

//#region Build the configuration

if (!existsSync(argv['configuration']))
    throw new Error('Couldn\'t find the configuration file at "' + path + '".');

const config = JSON.parse(readFileSync(argv['configuration'], 'utf8'));

//#endregion

const cloudflare = new Cloudflare({
  email: config.cloudflare.email,
  key: config.cloudflare.key
});

// Start by fetching the current IP address.
Axios.get("https://ipinfo.io/json")
  .then(async response => {
    // Throw an error if the IP address fetching fails.
    if (response.status !== 200)
      throw new Error('Failed to fetch the current IP address.');

    const ip = response.data.ip;

    // Filter the correct zone with the domain specified in the configuration.
    const zone = (await cloudflare.zones.browse()).result
      .filter(z => z.name === config.cloudflare.domain)[0];
    
    // Throw an error if none of the zones matches the domain.
    if (!zone)
      throw new Error(`Couldn't find a zone with the domain "${config.cloudflare.domain}".`);

    // Get the 'A' record from the zone.
    const record = (await cloudflare.dnsRecords.browse(zone.id)).result
      .filter(r => r.type === 'A')[0];

    // Throw an error if the zone doesn't have the 'A' record.
    if (!record)
      throw new Error(`The zone "${zone.id}" doesn't have a record of the type 'A'.`);

    // Update if the IP address have changed.
    if (record.content !== ip) {
      await cloudflare.dnsRecords.edit(zone.id, record.id, {
        ...record,
        content: ip
      });

      console.log(`Updated the IP address of "${zone.name}" from "${record.content}" to "${ip}".`)
    }
  });

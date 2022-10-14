let axios = require("axios");
const Influx = require('influx');


const baseurl = `172.31.6.188:8086`;
const tokenId =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZjdmNGEyZTU4MzVhZTI3YThkM2MzNjYiLCJpYXQiOjE2MDQ1MDExMzd9.AoYDDargIIwN36vH2w7Ns1zHTM1rGGJHe513tOTYb8o";
const depl_id = "drakewell";

const vehicleClassesOK = {
	Ped: "Pedestrians",
	Pcl: "Bycicles",
	Mpd: "Mopeds",
	Mcl: "Motorcycles",
	Horse: "Horses",
	Car: "Cars and Light Vans",
	"Car+T": "Cars with Trailer",
	Rigid: "Rigids, Heavy Vans or Mini Buses",
	Artic: "Articulated HGVs",
	Bus: "Buses and Coaches",
	avgSpeed: "Vehicles Speed",
};

const directions = {
	N: "northbound",
	E: "eastbound",
	S: "southbound",
	W: "westbound",
	NE: "northeast bound",
	SE: "southeast bound",
	SW: "southwest bound",
	NW: "northwest bound",
};




let startTime = new Date('2020-09-01T00:00:00')
let endTime   = new Date('2020-09-01T03:00:00')






getLocations = async () => {

  while(startTime < new Date()) {

    const st = startTime.toISOString().substring(0,19).replace('T', ' ')
    const et = endTime.toISOString().substring(0,19).replace('T', ' ')

    console.log(st)
    console.log(et)

    const res1 = await axios.get(
      `https://drakewell03.drakewell.com/export/binned/ae9fe13c2ec14fbe?startTime=${st}&endTime=${et}`
    );

    const data = res1.data;

    for (let i in data) {
      const site = data[i].site;
      console.log(`Working out Drakewell Traffic Camera ${site.name}`)

      try {
        const plat_id = `${depl_id}__${site.name}`;
        const plat_name = `${
          depl_id.charAt(0).toUpperCase() + depl_id.slice(1)
        }  ${site.name}`;
        
        const vehicleClasses = data[i].bins.classes
        for (let j in data[i].data) {
          const dateTime = new Date(data[i].data[j].endTime)
          const year = parseInt(dateTime.getFullYear())
          const month = parseInt(dateTime.getMonth()) + 1
          const day = parseInt(dateTime.getDate())
          const hours = parseInt(dateTime.getHours())
          const minutes = parseInt(dateTime.getMinutes())
          const seconds = parseInt(dateTime.getSeconds())
          const weekday = parseInt(dateTime.getDay())

          for (let d in data[i].data[j].byDirection) {
            const direction = data[i].data[j].byDirection[d].direction
            const values = data[i].data[j].byDirection[d].byClass
            const speed = data[i].data[j].byDirection[d].avgSpeed
						const count = data[i].data[j].byDirection[d].count

            for(let v in values) {

              if(Object.keys(vehicleClassesOK).includes(vehicleClasses[v].name)){
                const vehicleCls = vehicleClasses[v].name
                const value = Number(values[v])
                const ref = `${plat_id}__${vehicleCls.toLowerCase()}_${direction.toLowerCase()}`
                const measurement = vehicleClasses[v].name === "avgSpeed" ? "vehicle-speed" : (vehicleClasses[v].name === 'Ped' ? "people-count" : "vehicle-count")
                const newValue = {
                  measurement,
                  tags: { ref },
                  fields: {
                    value,
                    year,
                    month,
                    day,
                    hours,
                    minutes,
                    seconds,
                    weekday
                  },
                  timestamp: dateTime.getTime() / 1000
                }
                // console.log(newValue)
                try{
                  await influx.writePoints([
                    newValue
                  ], {precision: 's'})
                } catch (e) {
                  console.log(`ERROR ==> ${e.message}`)
                }
              }
            }


            const value = Number(speed)
            const ref = `${plat_id}__avgspeed_${direction.toLowerCase()}`
            const measurement = "vehicle-speed"
            const newValue = {
              measurement,
              tags: { ref },
              fields: {
                value,
                year,
                month,
                day,
                hours,
                minutes,
                seconds,
                weekday
              },
              timestamp: dateTime.getTime() / 1000
            }
            // console.log(newValue)
            try{
              await influx.writePoints([
                newValue
              ], {precision: 's'})
            } catch (e) {
              console.log(`ERROR ==> ${e.message}`)
            }

						if (vehicleClasses === null || vehicleClasses === undefined) {
							const value = Number(count)
		          const ref = `${plat_id}__totcount_${direction.toLowerCase()}`
		          const measurement = "vehicle-count"
		          const newValue = {
		            measurement,
		            tags: { ref },
		            fields: {
		              value,
		              year,
		              month,
		              day,
		              hours,
		              minutes,
		              seconds,
		              weekday
		            },
		            timestamp: dateTime.getTime() / 1000
		          }
		          // console.log(newValue)
		          try{
		            await influx.writePoints([
		              newValue
		            ], {precision: 's'})
		          } catch (e) {
		            console.log(`ERROR ==> ${e.message}`)
		          }
						}

          }
        }
      } catch (e) {
        console.log(e.message);
      }
      
      console.log(`Done`)
    }
    
    startTime.setHours(startTime.getHours() + 3);
    endTime.setHours(endTime.getHours() + 3);
  }
};



const influx = new Influx.InfluxDB({
  host: '172.31.6.188:8086',  // AWS internal address of muo-archive
  // host: '10.99.110.194:8086', // on-Premise (UoM)  
  // host: 'localhost:8086',   
  database: 'mcri'
});

influx.getDatabaseNames()
.then(names => {
  if (!names.includes('mcri')) {
    console.log(`I'm gonna create the DB mrci`);
    return influx.createDatabase('mcri');
  }
  return console.log(`Found database 'mcri' in InfluxDB`);
})
.catch(error => console.log({ error }));


getLocations();


'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const axios = require('axios');
const slugify = require('slugify');

const getGameInfo = async (slug) => {
  const jsdom = require('jsdom');
  const { JSDOM } = jsdom;
  const body = await axios.get(`https://www.gog.com/game/${slug}`);
  const dom = new JSDOM(body.data);

  const description = dom.window.document.querySelector('[content-summary-section-id="description"]');

  return {
    rating: 'BR0',
    description: description.innerHTML,
    short_description: description.textContent.slice(0, 160),
  };
};

const getByName = async (name, entityName) => {
  const item = await strapi.services[entityName].find({ name });

  return item.length ? item[0] : null;
};

const create = async (name, entityName) => {
  const item = await getByName(name, entityName);

  if (!item) {
    return await strapi.services[entityName].create({
      name,
      slug: slugify(name, { lower: true }),
    });
  }
};

const createManyToMany = async (products) => {
  const developers = {};
  const publishers = {};
  const categories = {};
  const platforms = {};

  products.forEach(product => {
    const { developer, publisher, genres, supportedOperatingSystems } = product;

    genres &&
      genres.forEach(item => categories[item] = true);

    supportedOperatingSystems &&
      supportedOperatingSystems.forEach(item => platforms[item] = true);

    developers[developer] = true;
    publishers[publisher] = true;
  });

  return Promise.all([
    ...Object.keys(developers).map(name => create(name, 'developer')),
    ...Object.keys(publishers).map(name => create(name, 'publisher')),
    ...Object.keys(categories).map(name => create(name, 'category')),
    ...Object.keys(platforms).map(name => create(name, 'platform')),
  ]);
};

const setImage = async ({ image, game, field = 'cover' }) => {
  const url = `https:${image}_bg_crop_1680x655.jpg`;
  const { data } = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(data, 'base64');

  const FormData = require('form-data');
  const formData = new FormData();

  formData.append('refId', game.id);
  formData.append('ref', 'game');
  formData.append('field', field);
  formData.append('files', buffer, { filename: `${game.slug}.jpg` });

  console.log(`Uploading ${field} image: ${game.slug}.jpg`);

  await axios.get({
    method: 'POST',
    url: `http://${strapi.config.host}:${strapi.config.port}/upload`,
    data: formData,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
    },
  });
};

const createGame = async (products) => {
  await Promise.all(
    products.map(async product => {
      const item = await getByName(product.title, 'game');

      if (!item) {
        console.log(`Creating ${product.title}...`);

        const game = await strapi.services.game.create({
          name: product.title,
          slug: product.slug.replace(/_/g, '-'),
          price: product.price.amount,
          release_date: new Date(
            Number(product.globalReleaseDate) * 1000
          ).toISOString(),
          categories: await Promise.all(
            product.genres.map(name => getByName(name, 'category'))
          ),
          platforms: await Promise.all(
            product.supportedOperatingSystems.map(name =>
              getByName(name, 'platform')
            )
          ),
          developers: [await getByName(product.developer, 'developer')],
          publisher: await getByName(product.publisher, 'publisher'),
          ...(await getGameInfo(product.slug)),
        });

        await setImage({ image: product.image, game });

        return game;
      }
    })
  );
};

module.exports = {
  populate: async (params) => {
    const gogApiUrl = `https://www.gog.com/games/ajax/filtered?mediaType=game&page=1&sort=popularity`;

    const { data: { products = [] } } = await axios.get(gogApiUrl);

    await createManyToMany(products);
    await createGame([products[13], products[15]]);

    // console.log(new Date(
    //   Number(products[5].globalReleaseDate) * 1000
    // ).toISOString());
  },
};

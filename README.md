# Northcoders News API

To access the hosted version of this project and a description of all available endpoints go to [https://nc-news-jokh.onrender.com/api](https://nc-news-jokh.onrender.com/api) 

### The API can:
- respond with a list of topics
- respond with all articles, comments or users in the database
- respond with a given article or comment by its id
- articles can be queried with the parameters: sort_by, order, topic
  - e.g. [/api/articles?topic=cooking&sort_by=comment_count](https://nc-news-jokh.onrender.com/api/articles?topic=cooking&sort_by=comment_count) will return all 'cooking' articles sorted by the number of comments

- ---

### Build instructions

Clone the repo: `git clone https://github.com/joshuatdr/be-nc-news.git`

Install all project dependencies with: `npm install`

Create databases, add tables and insert test data: `npm run setup-dbs` then `npm run seed`

To connect locally, a .env.test or .env.development file must be created in the root of the project, containing `PGDATABASE=nc_news_test` for test data or `PGDATABASE=nc_news` for more realistic-looking data

Then run all tests with `npm test app.test.js`

#### Minimum versions required:

- Node: >=14.x
- Postgres: >=8.2.x

- ---

This portfolio project was created as part of a Digital Skills Bootcamp in Software Engineering provided by [Northcoders](https://northcoders.com/)

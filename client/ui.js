import { GameObject } from './game.js';

export class UI extends GameObject {
    Init() {
        this.slug;

        this.game.events.RegisterEventListener("OnObjectClick", this, ({ object }) => {
            let slug = object.userData.name.split(":")[1]; //TODO extract slug with some string manipulation.

            this.slug = slug;

            slug = '"' + slug + '"';

            let query = `
            {
                entries(section: "project", slug: ${slug}, limit: 1, orderBy: "title ASC") {
                  ... on project_project_Entry {
                    title
                    students {
                      name
                    }
                    referralLinks {
                      ... on referralLinks_referralLink_BlockType {
                        referralLink
                      }
                    }
                    supervisor {
                      ... on person_people_Entry {
                        title
                      }
                    }
                    course {
                      ... on course_Category {
                        title
                        abbreviation
                      }
                    }
                    theme {
                      ... on theme_Category {
                        title
                      }
                    }
                    hashtags {
                      ... on hashtags_Tag {
                        title
                      }
                    }
                    description
                    thumbnail {
                      ... on static_Asset {
                        url
                      }
                    }
                    projectMatrix {
                      ... on projectMatrix_image_BlockType {
                        image {
                          ... on static_Asset {
                            url
                          }
                        }
                        caption
                      }
                      ... on projectMatrix_imageGrid_BlockType {
                        images {
                          ... on static_Asset {
                            url
                          }
                        }
                      }
                      ... on projectMatrix_iFrame_BlockType {
                        videoID
                        context
                        caption
                      }
                      ... on projectMatrix_text_BlockType {
                        heading
                        text
                      }
                    }
                  }
                }
              }
            `;

            let body = JSON.stringify({ query, variables: {} });

            fetch('https://deshowcase.london/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': 'Bearer kh6W0EDk33edE3Wu_cWNykLSHVJUc_J0'
                },
                body
            })
            .then(r => r.json())
            .then((data) => {
              console.log(data);
              this.game.events.Trigger("OpenModal", { data,  slug: this.slug });
            }) // TODO Trigger an event with the data that opens a modal/url and locks control.
            .catch(error => console.error(error));
        });
    }
}
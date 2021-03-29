import { GameObject } from './game.js';

export class UI extends GameObject {
	Init() {
		this.slug;

		this.cache = {};

		this.game.events.RegisterEventListener("OnObjectClick", this, ({ object, slug }) => {
			console.log(object);
			this.slug = slug;
			slug = '"' + slug + '"';
			console.log("Fetching " + this.slug);

			// this.game.events.Trigger("OpenModalWithContents", {data: {}, slug: {}});

			// setTimeout(() => {
			// 	this.cache["test-slug"] = {};
			// 	this.game.events.Trigger("SetModalContents", {data: {}, slug: {}});
			// }, 1000);

			if (this.cache[this.slug]) {
				this.game.events.Trigger("OpenModalWithContents", {slug: this.slug, data: this.cache[this.slug]});
			} else {
				this.game.events.Trigger("OpenModal", {});

				let query = `
				{
					entries(siteId: 1, section: "project", slug: ${slug}, orderBy: "title ASC") {
					  ... on project_project_Entry {
						title
						url
						thumbnail {
 							... on static_Asset {
 							url
 							}
 						}
						contributors {
						  ... on person_person_Entry {
							title
						  }
						}
						description
					  }
					}
				  }`;

				let body = JSON.stringify({ query, variables: {} });

				fetch('https://deshowcase.london/api', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'Authorization': 'Bearer vuxMlpBoejc4a5JGVa7cDzKTT7Wc8Yr4'
					},
					body
				})
				.then(r => r.json())
				.then((data) => {
					console.log(data);

					if (data.errors) {
						data.errors.forEach(error => {
							console.warn(error.message);
						});
			
						this.game.events.Trigger("SetErrorModal", {message: "An unexpected error occurred when trying to fetch this project."});
						return;
					}
					
					if (data.data)
						if (data.data.entries)
							if (data.data.entries.length === 0) {
								console.warn("No data entries received.");
								this.game.events.Trigger("SetErrorModal", {message: "This project could not be found."});
								return;
							}

					this.cache[this.slug] = data;
					this.game.events.Trigger("SetModalContents", { data,  slug: this.slug });
				})
				.catch(error => console.error(error));
			}
		});

		this.game.events.RegisterEventListener("FetchProjectNames", this, () => {
			let query = `
				{
					entries(siteId: 1, section: "project", orderBy: "title ASC") {
					  ... on project_project_Entry {
						title
						slug
						contributors {
							... on person_person_Entry {
							  title
							}
						  }
					  }
					}
				  }`;

				let body = JSON.stringify({ query, variables: {} });

				fetch('https://deshowcase.london/api', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
						'Authorization': 'Bearer vuxMlpBoejc4a5JGVa7cDzKTT7Wc8Yr4'
					},
					body
				})
				.then(r => r.json())
				.then((data) => {
					console.log(data);

					if (data.errors) {
						data.errors.forEach(error => {
							console.warn(error.message);
						});

						return;
					}
					
					if (data.data)
						if (data.data.entries)
							if (data.data.entries.length === 0) {
								console.warn("No data entries received.");
								return;
							}
					
					this.game.events.Trigger("LoadProjectNames", { data });
				})
				.catch(error => console.error(error));
		});
	}
}

// let query = `
// 				{
// 					entries(section: "project", slug: ${slug}, limit: 1, orderBy: "title ASC") {
// 						... on project_project_Entry {
// 						title
// 						students {
// 							name
// 						}
// 						referralLinks {
// 							... on referralLinks_referralLink_BlockType {
// 							referralLink
// 							}
// 						}
// 						supervisor {
// 							... on person_people_Entry {
// 							title
// 							}
// 						}
// 						course {
// 							... on course_Category {
// 							title
// 							abbreviation
// 							}
// 						}
// 						theme {
// 							... on theme_Category {
// 							title
// 							}
// 						}
// 						hashtags {
// 							... on hashtags_Tag {
// 							title
// 							}
// 						}
// 						description
// 						thumbnail {
// 							... on static_Asset {
// 							url
// 							}
// 						}
// 						projectMatrix {
// 							... on projectMatrix_image_BlockType {
// 							image {
// 								... on static_Asset {
// 								url
// 								}
// 							}
// 							caption
// 							}
// 							... on projectMatrix_imageGrid_BlockType {
// 							images {
// 								... on static_Asset {
// 								url
// 								}
// 							}
// 							}
// 							... on projectMatrix_iFrame_BlockType {
// 							videoID
// 							context
// 							caption
// 							}
// 							... on projectMatrix_text_BlockType {
// 							heading
// 							text
// 							}
// 						}
// 						}
// 					}
// 				}`;
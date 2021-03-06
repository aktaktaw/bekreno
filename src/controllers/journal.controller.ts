import {
  authenticate,
  AuthenticationBindings
} from '@loopback/authentication';
import {Getter, inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody
} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {Journal} from '../models';
import {JournalRepository} from '../repositories';

export class JournalController {
  constructor(
    @repository(JournalRepository)
    public journalRepository : JournalRepository,
    @inject.getter(AuthenticationBindings.CURRENT_USER)
    public getCurrentUser: Getter<UserProfile>,
  ) {}

  @post('/journal', {
    responses: {
      '200': {
        description: 'Journal model instance',
        content: {'application/json': {schema: getModelSchemaRef(Journal)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Journal, {
            title: 'NewJournal',
            exclude: ['id'],
          }),
        },
      },
    })
    journal: Omit<Journal, 'id'>,
  ): Promise<Journal> {
    journal.status = 0
    return this.journalRepository.create(journal);
  }

  @get('/journal/count', {
    responses: {
      '200': {
        description: 'Journal model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Journal) where?: Where<Journal>,
  ): Promise<Count> {
    return this.journalRepository.count(where);
  }

  @get('/journal', {
    responses: {
      '200': {
        description: 'Array of Journal model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Journal, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Journal) filter?: Filter<Journal>,
  ): Promise<Journal[]> {
    return this.journalRepository.find(filter);
  }

  @patch('/journal', {
    responses: {
      '200': {
        description: 'Journal PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Journal, {partial: true}),
        },
      },
    })
    journal: Journal,
    @param.where(Journal) where?: Where<Journal>,
  ): Promise<Count> {
    return this.journalRepository.updateAll(journal, where);
  }

  @get('/journal/{id}', {
    responses: {
      '200': {
        description: 'Journal model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Journal, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Journal, {exclude: 'where'}) filter?: FilterExcludingWhere<Journal>
  ): Promise<Journal> {
    return this.journalRepository.findById(id, filter);
  }

  @patch('/journal/{id}', {
    responses: {
      '204': {
        description: 'Journal PATCH success',
      },
    },
  })
  @authenticate('jwt')
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Journal, {partial: true}),
        },
      },
    })
    journal: Journal,
  ): Promise<void> {
    const userProfile = await this.getCurrentUser();
    //console.log(userProfile.roles);
    let roles = userProfile.roles.findIndex((x: {roles: string;}) => x.roles === 'admin')
    if(roles === 1)
    {
      journal.status = 2 //Admin reviewed the journal
      await this.journalRepository.replaceById(id, journal);
    }
    else
    {
      journal.status = 1 //User edit the journal
      await this.journalRepository.replaceById(id, journal);
    }
    //await this.journalRepository.replaceById(id, journal);
  }

  @put('/journal/{id}', {
    responses: {
      '204': {
        description: 'Journal PUT success',
      },
    },
  })
  @authenticate('jwt')
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody({
      'application/json':{
        schema: getModelSchemaRef(Journal)
      }
    })
    journal: Journal,

  ): Promise<void> {
    const userProfile = await this.getCurrentUser();

    //let profile = userProfile.role.find(userProfile => userProfile.role === 'admin')


    /*
      let user = Users.find((user:any)=>user.id === query)

    */


    /*if(userProfile.roles.findIndex(e=> e==='admin'))
    {
      journal.status = 2 //Admin reviewed the journal
    }
    else
    {
      journal.status = 1 //User edit the journal
    }
    */

    await this.journalRepository.replaceById(id, journal);
  }

  @del('/journal/{id}', {
    responses: {
      '204': {
        description: 'Journal DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.journalRepository.deleteById(id);
  }
}

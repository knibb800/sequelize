'use strict';

const chai = require('chai');

const expect = chai.expect;
const Support = require('../../support');

const current = Support.sequelize;
const sinon = require('sinon');
const { DataTypes, Sequelize } = require('@sequelize/core');

describe(Support.getTestDialectTeaser('Model'), () => {
  if (current.dialect.supports.upserts) {
    describe('method upsert', () => {
      before(function () {
        this.User = current.define('User', {
          name: DataTypes.STRING,
          virtualValue: {
            type: DataTypes.VIRTUAL,
            set(val) {
              this.value = val;
            },
            get() {
              return this.value;
            },
          },
          value: DataTypes.STRING,
          secretValue: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
          },
        });

        this.UserNoTime = current.define('UserNoTime', {
          name: DataTypes.STRING,
        }, {
          timestamps: false,
        });
      });

      beforeEach(function () {
        this.query = sinon.stub(current, 'queryRaw').resolves();
        this.stub = sinon.stub(current.queryInterface, 'upsert').resolves([this.User.build(), true]);
      });

      afterEach(function () {
        this.query.restore();
        this.stub.restore();
      });

      it('skip validations for missing fields', async function () {
        await expect(this.User.upsert({
          name: 'Grumpy Cat',
        })).not.to.be.rejectedWith(Sequelize.ValidationError);
      });

      it('creates new record with correct field names', async function () {
        await this.User
          .upsert({
            name: 'Young Cat',
            virtualValue: '999',
          });

        expect(Object.keys(this.stub.getCall(0).args[1])).to.deep.equal([
          'name', 'value', 'created_at', 'updatedAt',
        ]);
      });

      it('creates new record with timestamps disabled', async function () {
        await this.UserNoTime
          .upsert({
            name: 'Young Cat',
          });

        expect(Object.keys(this.stub.getCall(0).args[1])).to.deep.equal([
          'name',
        ]);
      });

      it('updates all changed fields by default', async function () {
        await this.User
          .upsert({
            name: 'Old Cat',
            virtualValue: '111',
          });

        expect(Object.keys(this.stub.getCall(0).args[2])).to.deep.equal([
          'name', 'value', 'updatedAt',
        ]);
      });
    });
  }
});
